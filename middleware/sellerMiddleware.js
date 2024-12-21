import { models } from '../models/index.js';
const { User, Seller } = models;

export const sellerMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    const seller = await Seller.findOne({
      where: { 
        userId: req.user.id,
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

    req.seller = seller;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification des droits vendeur"
    });
  }
}; 