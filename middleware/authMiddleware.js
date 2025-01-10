import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';

export const protect = async (req, res, next) => {
  try {
    console.log('🔒 Début de la vérification d\'authentification');
    
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extrait:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('❌ Pas de token trouvé');
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    try {
      console.log('Vérification du token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded);
      
      console.log('Recherche de l\'utilisateur...');
      const user = await models.User.findOne({
        where: { 
          id: decoded.id,
          status: 'active'
        },
        attributes: ['id', 'name', 'email', 'role', 'status', 'avatar', 'lastLogin']
      });

      console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');

      if (!user) {
        console.log('❌ Utilisateur non trouvé dans la base de données');
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Convertir l'instance Sequelize en objet simple et ajouter au req
      const userData = user.get({ plain: true });
      req.user = userData;
      console.log('✅ Authentification réussie pour:', userData.email);
      console.log('Données utilisateur attachées:', userData);
      
      return next();
    } catch (jwtError) {
      console.error('❌ Erreur JWT:', jwtError.message);
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return res.status(500).json({
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!sellerProfile) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé - Profil vendeur requis"
      });
    }

    req.seller = sellerProfile;
    next();
  } catch (error) {
    console.error('Erreur middleware seller:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du profil vendeur"
    });
  }
};

export default {
  protect,
  admin,
  seller
};