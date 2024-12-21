import { models } from '../models/index.js';
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

import { models } from '../models/index.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('Token manquant');
      return res.status(401).json({
        success: false,
        message: 'Token non fourni'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded);

      const user = await models.User.findOne({
        where: { id: decoded.id }
      });

      if (!user) {
        console.log('Utilisateur non trouvé');
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      console.log('Erreur JWT:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export const isAdmin = asyncHandler(async (req, res, next) => {
  const { email } = req.user;
  const adminUser = await models.User.findOne({ 
    where: { email, role: 'admin' }
  });

  if (!adminUser) {
    throw new Error("Vous n'êtes pas administrateur");
  }
  next();
});

export const authorization = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "Aucun token fourni" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findOne({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    if (user.role !== 'vendeur') {
      return res.status(403).json({ 
        message: "Accès refusé : vous devez être un vendeur pour effectuer cette action" 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expiré" });
    }
    return res.status(401).json({ message: "Token invalide" });
  }
});

export const verifyToken = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token non fourni' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findOne({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Token invalide',
      error: error.message
    });
  }
});

export const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    const user = await models.User.findOne({
      where: { id: req.user.id }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé - Droits administrateur requis"
      });
    }

    next();
  } catch (error) {
    console.error('Erreur de vérification admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export const corsErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
      error: err.message
    });
  } else {
    next(err);
  }
};

export default{authMiddleware,isAdmin,authorization,verifyToken,verifyAdmin}