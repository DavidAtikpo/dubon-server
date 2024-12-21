import { models } from '../models/index.js';
const { Review, User, Product, Seller, DeliveryPerson } = models;
import { Op } from 'sequelize';

export const createReview = async (req, res) => {
  try {
    const { targetId, targetType, rating, title, content, images } = req.body;

    // Vérifier si l'utilisateur a déjà laissé un avis
    const existingReview = await Review.findOne({
      where: {
        userId: req.user.id,
        targetId,
        targetType
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà laissé un avis"
      });
    }

    // Vérifier si l'utilisateur peut laisser un avis (par exemple, a acheté le produit)
    if (targetType === 'product') {
      const hasOrdered = await Order.findOne({
        where: {
          userId: req.user.id,
          status: 'delivered',
          '$OrderItems.productId$': targetId
        },
        include: [{
          model: OrderItem,
          as: 'items'
        }]
      });

      if (!hasOrdered) {
        return res.status(403).json({
          success: false,
          message: "Vous devez avoir acheté le produit pour laisser un avis"
        });
      }
    }

    const review = await Review.create({
      userId: req.user.id,
      targetId,
      targetType,
      rating,
      title,
      content,
      images,
      verified: true // Si l'achat est vérifié
    });

    // Mettre à jour la note moyenne de la cible
    await updateTargetRating(targetId, targetType);

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'avis",
      error: error.message
    });
  }
};

export const getReviews = async (req, res) => {
  try {
    const { targetId, targetType, page = 1, limit = 10, sort = 'recent' } = req.query;
    const offset = (page - 1) * limit;

    let order = [['createdAt', 'DESC']];
    if (sort === 'helpful') {
      order = [['helpful', 'DESC']];
    } else if (sort === 'rating') {
      order = [['rating', 'DESC']];
    }

    const reviews = await Review.findAndCountAll({
      where: { targetId, targetType },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'profilePhotoUrl']
      }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        reviews: reviews.rows,
        total: reviews.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(reviews.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des avis",
      error: error.message
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, content, images } = req.body;

    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    await review.update({
      rating,
      title,
      content,
      images,
      edited: true
    });

    // Mettre à jour la note moyenne de la cible
    await updateTargetRating(review.targetId, review.targetType);

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'avis",
      error: error.message
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    const { targetId, targetType } = review;
    await review.destroy();

    // Mettre à jour la note moyenne de la cible
    await updateTargetRating(targetId, targetType);

    res.status(200).json({
      success: true,
      message: "Avis supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'avis",
      error: error.message
    });
  }
};

export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    await review.increment('helpful');

    res.status(200).json({
      success: true,
      message: "Avis marqué comme utile"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du marquage de l'avis",
      error: error.message
    });
  }
};

// Fonction utilitaire pour mettre à jour la note moyenne
const updateTargetRating = async (targetId, targetType) => {
  let model;
  switch (targetType) {
    case 'product':
      model = Product;
      break;
    case 'seller':
      model = Seller;
      break;
    case 'delivery':
      model = DeliveryPerson;
      break;
    default:
      throw new Error('Type de cible invalide');
  }

  const stats = await Review.findAll({
    where: { targetId, targetType, status: 'approved' },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
    ]
  });

  await model.update({
    rating: stats[0].dataValues.averageRating || 0,
    reviewCount: stats[0].dataValues.totalReviews || 0
  }, {
    where: { id: targetId }
  });
}; 