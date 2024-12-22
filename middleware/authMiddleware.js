import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    let accessToken;

    // Vérifier si le token est présent dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      accessToken = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

      // Récupérer l'utilisateur
      const user = await models.User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Non autorisé - Utilisateur non trouvé'
        });
      }

      // Vérifier si l'utilisateur est actif
      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé ou suspendu'
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token invalide'
      });
    }
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export const admin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }
    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
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