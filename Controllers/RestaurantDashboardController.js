import { models } from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboardStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier que le restaurant appartient au vendeur
    const restaurant = await models.Restaurant.findOne({
      where: {
        id: restaurantId,
        userId: req.user.id
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Obtenir les commandes du jour
    const todayOrders = await models.Order.count({
      where: {
        restaurantId,
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    // Obtenir les commandes en attente
    const pendingOrders = await models.Order.count({
      where: {
        restaurantId,
        status: 'pending'
      }
    });

    // Calculer le chiffre d'affaires du jour
    const todayRevenue = await models.Order.sum('total', {
      where: {
        restaurantId,
        status: 'delivered',
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    // Obtenir les réservations du jour
    const todayReservations = await models.Reservation.count({
      where: {
        restaurantId,
        date: today
      }
    });

    // Obtenir les réservations en attente
    const pendingReservations = await models.Reservation.count({
      where: {
        restaurantId,
        status: 'pending'
      }
    });

    // Calculer la note moyenne
    const ratings = await models.Review.findAll({
      where: { restaurantId },
      attributes: [
        [models.sequelize.fn('AVG', models.sequelize.col('rating')), 'averageRating']
      ]
    });

    // Obtenir les plats populaires
    const popularDishes = await models.Order.findAll({
      where: {
        restaurantId,
        status: 'delivered'
      },
      attributes: [
        [models.sequelize.fn('json_array_elements', models.sequelize.col('items')), 'item']
      ],
      raw: true,
      limit: 5,
      order: [[models.sequelize.literal('count'), 'DESC']],
      group: ['item->name']
    });

    // Obtenir les avis récents
    const recentReviews = await models.Review.findAll({
      where: { restaurantId },
      include: [{
        model: models.User,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']],
      limit: 3
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        todayRevenue: todayRevenue || 0,
        todayReservations,
        pendingReservations,
        averageRating: ratings[0]?.averageRating || 0,
        popularDishes: popularDishes.map(({ item }) => ({
          name: item.name,
          orders: item.quantity
        })),
        recentReviews: recentReviews.map(review => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          userName: review.User.name,
          date: review.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// Obtenir les statistiques de vente par période
export const getSalesStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { period = 'week' } = req.query;

    let dateFilter;
    const now = new Date();

    switch (period) {
      case 'day':
        dateFilter = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = new Date(now.setDate(now.getDate() - 7));
    }

    const sales = await models.Order.findAll({
      where: {
        restaurantId,
        status: 'delivered',
        createdAt: {
          [Op.gte]: dateFilter
        }
      },
      attributes: [
        [models.sequelize.fn('date_trunc', 'day', models.sequelize.col('createdAt')), 'date'],
        [models.sequelize.fn('count', models.sequelize.col('id')), 'orders'],
        [models.sequelize.fn('sum', models.sequelize.col('total')), 'revenue']
      ],
      group: ['date'],
      order: [[models.sequelize.literal('date'), 'ASC']]
    });

    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de vente',
      error: error.message
    });
  }
}; 