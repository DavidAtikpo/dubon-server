import { models } from '../models/index.js';
import jwt from 'jsonwebtoken';

export const sellerAuthMiddleware = async (req, res, next) => {
  try {
    // Vérifier le token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant"
      });
    }

    // Décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si l'utilisateur est un vendeur actif
    const seller = await models.Seller.findOne({
      where: {
        userId: user.id,
        status: 'approved',
        isBlocked: false
      }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Accès vendeur non autorisé"
      });
    }

    // Ajouter les infos à la requête
    req.user = user;
    req.seller = seller;
    next();
  } catch (error) {
    console.error('Erreur auth vendeur:', error);
    res.status(401).json({
      success: false,
      message: "Erreur d'authentification"
    });
  }
}; 