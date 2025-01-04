import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

export const protect = async (req, res, next) => {
  console.log('=== Middleware protect ===');
  console.log('Headers:', req.headers);
  
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extrait:', token);
    }

    if (!token) {
      console.log('Pas de token trouvé');
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded);

      const user = await models.User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      console.log('Utilisateur trouvé:', user ? user.id : 'aucun');

      if (!user) {
        console.log('Utilisateur non trouvé');
        return res.status(401).json({
          success: false,
          message: 'Non autorisé - Utilisateur non trouvé'
        });
      }

      req.user = user;
      console.log('Middleware protect OK');
      next();
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token invalide'
      });
    }
  } catch (error) {
    console.error('Erreur middleware protect:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export const admin = async (req, res, next) => {
  try {
    // Vérifier le token dans les headers
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur admin
    const admin = await models.User.findOne({
      where: {
        id: decoded.id,
        role: 'admin',
        status: 'active'
      }
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    // Ajouter l'admin à la requête
    req.user = admin;
    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export const seller = async (req, res, next) => {
  try {
    if (!req.user || !['seller', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux vendeurs'
      });
    }
    next();
  } catch (error) {
    console.error('Erreur middleware vendeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default {
  protect,
  admin,
  seller
};