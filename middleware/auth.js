import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

// Vérifie le token JWT
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Accès non autorisé. Token manquant"
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Récupérer l'utilisateur
      const user = await models.User.findByPk(decoded.id, {
        attributes: ['id', 'name', 'email', 'role', 'status']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non trouvé"
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: "Compte désactivé ou suspendu"
        });
      }

      // Ajouter l'utilisateur à l'objet request
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: "Token expiré"
        });
      }
      
      return res.status(401).json({
        success: false,
        message: "Token invalide"
      });
    }

  } catch (error) {
    console.error('Erreur verifyToken:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du token"
    });
  }
};

// Vérifie si l'utilisateur est un admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs"
    });
  }
};

// Vérifie si l'utilisateur est un vendeur
export const isSeller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Accès réservé aux vendeurs"
    });
  }
};

// Vérifie si l'utilisateur est un admin ou un vendeur
export const isAdminOrSeller = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'seller')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Accès réservé aux administrateurs et vendeurs"
    });
  }
};

// Vérifie si l'utilisateur est le propriétaire de la ressource
export const isOwner = (resourceModel) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const resource = await resourceModel.findByPk(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Ressource non trouvée"
      });
    }

    if (resource.userId === req.user.id || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette ressource"
      });
    }
  } catch (error) {
    console.error('Erreur isOwner:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des droits"
    });
  }
}; 