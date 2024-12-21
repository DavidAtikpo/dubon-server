import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

// Middleware pour vérifier si l'utilisateur est un admin
export const adminMiddleware = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    // Vérifier si l'utilisateur est un admin
    const user = await models.User.findByPk(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux administrateurs"
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

// Middleware pour vérifier les permissions spécifiques
export const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = await models.User.findByPk(req.user.id, {
        include: [{
          model: models.Role,
          as: 'role',
          include: [{
            model: models.Permission,
            as: 'permissions'
          }]
        }]
      });

      if (!user.role.permissions.some(p => p.name === permission)) {
        return res.status(403).json({
          success: false,
          message: "Permission insuffisante"
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur",
        error: error.message
      });
    }
  };
};

// Middleware pour les super admins uniquement
export const superAdminOnly = async (req, res, next) => {
  try {
    const user = await models.User.findByPk(req.user.id);

    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux super administrateurs"
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware super admin:', error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message
    });
  }
};

export default {
  adminMiddleware,
  checkPermission,
  superAdminOnly
};
