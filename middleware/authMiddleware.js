import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';
const { User } = models;

export const protect = async (req, res, next) => {
  console.log('🔒 Middleware d\'authentification activé');
  console.log('Headers:', req.headers);
  
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token trouvé:', token ? 'Oui' : 'Non');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded);

      // Get user from the token
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      console.log('Utilisateur trouvé:', req.user ? 'Oui' : 'Non');

      if (!req.user) {
        console.log('❌ Utilisateur non trouvé dans la base de données');
        return res.status(401).json({
          success: false,
          message: "Non autorisé, utilisateur non trouvé"
        });
      }

      next();
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error);
      res.status(401).json({
        success: false,
        message: "Non autorisé, token invalide"
      });
    }
  }

  if (!token) {
    console.log('❌ Pas de token trouvé dans les headers');
    res.status(401).json({
      success: false,
      message: "Non autorisé, pas de token"
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