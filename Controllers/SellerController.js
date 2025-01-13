import { models } from '../models/index.js';

export const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: sellerId },
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
          include: [{
            model: models.UserProfile,
            as: 'profile',
            attributes: ['firstName', 'lastName']
          }]
        },
        {
          model: models.Shop,
          as: 'shop',
          attributes: ['id', 'name', 'description', 'logo', 'coverImage', 'rating', 'status', 'location']
        }
      ]
    });

    if (!sellerProfile) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: sellerProfile
    });
  } catch (error) {
    console.error('Error in getSellerProfile:', error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving seller profile",
      error: error.message
    });
  }
};

export const getSellerHistory = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const sellerId = req.seller.id;

    // Construire la requête de base
    const whereClause = {
      sellerId,
    };

    // Ajouter le filtre par type si spécifié
    if (type && type !== 'all') {
      whereClause.type = type;
    }

    // Ajouter le filtre par date si spécifié
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.$lte = new Date(endDate);
      }
    }

    // Récupérer l'historique
    const history = await SellerHistory.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 100 // Limiter à 100 entrées par défaut
    });

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
}; 