import { models } from '../models/index.js';
import { Op } from 'sequelize';

// Obtenir toutes les commandes d'un restaurant
export const getRestaurantOrders = async (req, res) => {
  try {
    const orders = await models.Order.findAll({
      where: {
        restaurantId: req.params.restaurantId,
        status: {
          [Op.not]: 'cancelled'
        }
      },
      include: [{
        model: models.User,
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour le statut d'une commande
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await models.Order.findByPk(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    // Vérifier que le restaurant appartient bien au vendeur
    const restaurant = await models.Restaurant.findOne({
      where: {
        id: order.restaurantId,
        userId: req.user.id
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    await order.update({ status });

    // Envoyer une notification au client
    if (status === 'ready') {
      // TODO: Implémenter les notifications
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les statistiques des commandes
export const getOrderStats = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { range = 'weekly' } = req.query;

    let dateFilter;
    const now = new Date();

    switch (range) {
      case 'daily':
        dateFilter = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'weekly':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        dateFilter = new Date(now.setDate(now.getDate() - 7));
    }

    const stats = await models.Order.findAll({
      where: {
        restaurantId,
        createdAt: {
          [Op.gte]: dateFilter
        }
      },
      attributes: [
        [models.sequelize.fn('sum', models.sequelize.col('total')), 'revenue'],
        [models.sequelize.fn('count', models.sequelize.col('id')), 'count'],
        'status'
      ],
      group: ['status']
    });

    const topDishes = await models.Order.findAll({
      where: {
        restaurantId,
        status: 'delivered'
      },
      attributes: [
        [models.sequelize.fn('json_array_elements', models.sequelize.col('items')), 'item']
      ],
      raw: true
    });

    // Traiter les données pour obtenir les plats les plus vendus
    const dishStats = topDishes.reduce((acc, curr) => {
      const item = JSON.parse(curr.item);
      if (!acc[item.id]) {
        acc[item.id] = {
          name: item.name,
          orders: 0,
          revenue: 0
        };
      }
      acc[item.id].orders += item.quantity;
      acc[item.id].revenue += item.price * item.quantity;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        stats,
        topDishes: Object.values(dishStats)
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 