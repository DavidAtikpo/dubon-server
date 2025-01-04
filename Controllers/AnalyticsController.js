import { models, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

export const getAnalytics = async (req, res) => {
  try {
    console.log('=== Début getAnalytics ===');
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Statistiques de base
    const [
      newUsers,
      newProducts,
      orderStats
    ] = await Promise.all([
      // Nouveaux utilisateurs
      models.User.count({
        where: {
          createdAt: { [Op.between]: [start, end] }
        }
      }),

      // Nouveaux produits
      models.Product.count({
        where: {
          createdAt: { [Op.between]: [start, end] }
        }
      }),

      // Statistiques commandes
      models.Order.findAll({
        where: {
          createdAt: { [Op.between]: [start, end] }
        },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('total')), 0), 'averageValue']
        ],
        raw: true
      })
    ]);

    // Revenus par catégorie via requête SQL directe
    const revenueByCategory = await sequelize.query(`
      SELECT 
        COALESCE(c.name, 'Sans catégorie') as category,
        COALESCE(SUM(p.price * oi.quantity), 0) as total
      FROM "Orders" o
      JOIN "OrderItems" oi ON o.id = oi."orderId"
      LEFT JOIN "Products" p ON oi."productId" = p.id
      LEFT JOIN "Categories" c ON p."categoryId" = c.id
      WHERE o."createdAt" BETWEEN :start AND :end
      AND o.status = 'COMPLETED'
      GROUP BY c.name
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculer le revenu total
    const [totalRevenue] = await sequelize.query(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "Orders"
      WHERE "createdAt" BETWEEN :start AND :end
      AND status = 'COMPLETED'
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Utilisateurs actifs (basé sur les commandes récentes)
    const [activeUsers] = await sequelize.query(`
      SELECT COUNT(DISTINCT "userId") as count
      FROM "Orders"
      WHERE "createdAt" BETWEEN :start AND :end
    `, {
      replacements: { start, end },
      type: sequelize.QueryTypes.SELECT
    });

    // Produits en rupture (basé sur quantity)
    const [outOfStock] = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM "Products"
      WHERE "quantity" <= 0
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Logger l'action
    await models.SystemLog.create({
      type: 'system',
      action: 'ANALYTICS_VIEW',
      description: 'Consultation des analytics',
      severity: 'info',
      category: 'analytics',
      message: 'Consultation des statistiques et analytics',
      metadata: {
        startDate,
        endDate,
        filters: req.query
      },
      userId: req.user?.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    console.log('Analytics récupérées avec succès');

    res.json({
      success: true,
      data: {
        revenue: {
          total: parseFloat(totalRevenue.total || 0),
          byCategory: revenueByCategory.map(item => ({
            category: item.category,
            total: parseFloat(item.total || 0)
          }))
        },
        users: {
          newUsers,
          activeUsers: parseInt(activeUsers.count || 0)
        },
        orders: {
          count: parseInt(orderStats[0]?.count || 0),
          averageValue: Math.round(parseFloat(orderStats[0]?.averageValue || 0))
        },
        products: {
          newProducts,
          outOfStock: parseInt(outOfStock.count || 0)
        }
      }
    });

  } catch (error) {
    console.error('Erreur getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des analytics',
      error: error.message
    });
  }
};

export default {
  getAnalytics
}; 