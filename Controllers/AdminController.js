import { models } from '../models/index.js';
const { User, Seller, Product, Order, Review, SystemLog, SystemSettings } = models;
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from 'sequelize';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({
      where: {
        email,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalUsers,
      newUsers,
      totalSellers,
      pendingSellers,
      totalProducts,
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue
    ] = await Promise.all([
      User.count(),
      User.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      }),
      Seller.count(),
      Seller.count({ where: { status: 'pending' } }),
      Product.count(),
      Order.count(),
      Order.count({
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      }),
      Order.sum('total_amount'),
      Order.sum('total_amount', {
        where: {
          createdAt: {
            [Op.between]: [startOfDay, endOfDay]
          }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, new: newUsers },
        sellers: { total: totalSellers, pending: pendingSellers },
        products: { total: totalProducts },
        orders: { total: totalOrders, today: todayOrders },
        revenue: { total: totalRevenue || 0, today: todayRevenue || 0 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

export const getSellerRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const requests = await Seller.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'phone']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        requests: requests.rows,
        total: requests.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(requests.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes",
      error: error.message
    });
  }
};

export const updateSellerRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const seller = await Seller.findByPk(id, {
      include: [{
        model: User,
        as: 'user'
      }]
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée"
      });
    }

    await seller.update({ status, message });

    // Si la demande est approuvée, mettre à jour le rôle de l'utilisateur
    if (status === 'approved') {
      await seller.user.update({ role: 'seller' });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la demande",
      error: error.message
    });
  }
};

export const manageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    await user.update({ status, role });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error: error.message
    });
  }
};

export const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    await review.update({ status, moderationMessage: message });

    // Si l'avis est approuvé ou rejeté, mettre à jour la note moyenne
    if (status === 'approved' || status === 'rejected') {
      await updateTargetRating(review.targetId, review.targetType);
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la modération de l'avis",
      error: error.message
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const stats = {
      // Statistiques des ventes
      sales: await Order.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
        ],
        where: {
          createdAt: { [Op.gte]: lastMonth }
        },
        group: [sequelize.fn('date_trunc', 'day', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'day', sequelize.col('created_at')), 'ASC']]
      }),

      // Top vendeurs
      topSellers: await Seller.findAll({
        attributes: [
          'id',
          'businessInfo',
          [sequelize.fn('COUNT', sequelize.col('Orders.id')), 'orderCount'],
          [sequelize.fn('SUM', sequelize.col('Orders.total_amount')), 'totalSales']
        ],
        include: [
          {
            model: Order,
            attributes: [],
            where: { createdAt: { [Op.gte]: lastMonth } }
          },
          {
            model: User,
            as: 'user',
            attributes: ['name', 'email']
          }
        ],
        group: ['Seller.id', 'user.id'],
        order: [[sequelize.fn('SUM', sequelize.col('Orders.total_amount')), 'DESC']],
        limit: 10
      }),

      // Produits les plus vendus
      topProducts: await Product.findAll({
        attributes: [
          'id',
          'name',
          'price',
          [sequelize.fn('COUNT', sequelize.col('OrderItems.id')), 'soldCount'],
          [sequelize.fn('SUM', sequelize.col('OrderItems.quantity')), 'totalQuantity']
        ],
        include: [{
          model: OrderItem,
          attributes: [],
          where: { createdAt: { [Op.gte]: lastMonth } }
        }],
        group: ['Product.id'],
        order: [[sequelize.fn('COUNT', sequelize.col('OrderItems.id')), 'DESC']],
        limit: 10
      }),

      // Statistiques des utilisateurs
      userStats: {
        total: await User.count(),
        active: await User.count({ where: { status: 'active' } }),
        newThisMonth: await User.count({
          where: {
            createdAt: { [Op.gte]: lastMonth }
          }
        })
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

export const manageProducts = async (req, res) => {
  try {
    const { action, productIds } = req.body;

    switch (action) {
      case 'approve':
        await Product.update(
          { status: 'active' },
          { where: { id: { [Op.in]: productIds } } }
        );
        break;
      case 'reject':
        await Product.update(
          { status: 'rejected' },
          { where: { id: { [Op.in]: productIds } } }
        );
        break;
      case 'delete':
        await Product.destroy({
          where: { id: { [Op.in]: productIds } }
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Action non valide"
        });
    }

    res.status(200).json({
      success: true,
      message: "Produits mis à jour avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la gestion des produits",
      error: error.message
    });
  }
};

export const getSystemLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const logs = await SystemLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        logs: logs.rows,
        total: logs.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(logs.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des logs",
      error: error.message
    });
  }
};

export const getAdminSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findAll();
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paramètres",
      error: error.message
    });
  }
};

export const updateAdminSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        SystemSettings.upsert({
          key,
          value,
          updatedBy: req.user.id
        })
      )
    );

    res.status(200).json({
      success: true,
      message: "Paramètres mis à jour avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des paramètres",
      error: error.message
    });
  }
}; 