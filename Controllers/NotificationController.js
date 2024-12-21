import { models } from '../models/index.js';
import { sendEmail } from '../utils/emailUtils.js';
import { sendSMS } from '../utils/smsUtils.js';
import { formatDate } from '../utils/dateUtils.js';

export const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la notification",
      error: error.message
    });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.rows,
        total: notifications.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(notifications.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    await notification.update({
      read: true,
      readAt: new Date()
    });

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la notification",
      error: error.message
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      {
        read: true,
        readAt: new Date()
      },
      {
        where: {
          userId: req.user.id,
          read: false
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des notifications",
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    await notification.destroy();
    res.status(200).json({
      success: true,
      message: "Notification supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la notification",
      error: error.message
    });
  }
};

export const sendSubscriptionExpiryNotification = async (sellerId) => {
  try {
    const seller = await models.Seller.findOne({
      where: { id: sellerId },
      include: [{
        model: models.User,
        attributes: ['email', 'phone']
      }]
    });

    if (!seller?.subscription) return;

    const expiryDate = new Date(seller.subscription.endDate);
    const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    await sendEmail({
      to: seller.User.email,
      subject: 'Votre abonnement expire bientôt',
      template: 'seller-subscription-expiring',
      data: {
        planName: seller.subscription.plan,
        expiryDate: formatDate(expiryDate),
        daysRemaining,
        renewalUrl: `${process.env.FRONTEND_URL}/seller/subscription/renew`
      }
    });
  } catch (error) {
    console.error('Erreur notification expiration:', error);
  }
};

export const sendPerformanceReport = async (sellerId) => {
  try {
    const seller = await models.Seller.findByPk(sellerId, {
      include: [{ model: models.User }]
    });

    // Calculer les métriques
    const [currentStats, previousStats] = await Promise.all([
      models.SellerStats.findOne({
        where: { 
          sellerId,
          date: {
            [Op.gte]: new Date(new Date().setDate(1))
          }
        }
      }),
      models.SellerStats.findOne({
        where: { 
          sellerId,
          date: {
            [Op.lt]: new Date(new Date().setDate(1)),
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      })
    ]);

    // Calculer les croissances
    const calculateGrowth = (current, previous) => {
      if (!previous) return 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    // Générer des recommandations
    const recommendations = [];
    if (currentStats.averageRating < 4) {
      recommendations.push("Améliorez votre service client pour augmenter vos notes");
    }
    if (calculateGrowth(currentStats.totalOrders, previousStats?.totalOrders) < 0) {
      recommendations.push("Vos ventes sont en baisse, pensez à lancer une promotion");
    }

    await sendEmail({
      to: seller.User.email,
      subject: 'Rapport de performance mensuel',
      template: 'seller-performance-report',
      data: {
        period: formatDate(new Date(), 'MMMM YYYY'),
        totalSales: currentStats.totalRevenue,
        salesGrowth: calculateGrowth(currentStats.totalRevenue, previousStats?.totalRevenue),
        orderCount: currentStats.totalOrders,
        orderGrowth: calculateGrowth(currentStats.totalOrders, previousStats?.totalOrders),
        averageRating: currentStats.averageRating,
        reviewCount: currentStats.metrics.totalReviews,
        conversionRate: ((currentStats.totalOrders / currentStats.metrics.totalVisits) * 100).toFixed(1),
        recommendations,
        dashboardUrl: `${process.env.FRONTEND_URL}/seller/dashboard/analytics`
      }
    });
  } catch (error) {
    console.error('Erreur rapport performance:', error);
  }
};

export const sendDisputeNotification = async (disputeId) => {
  try {
    const dispute = await models.Dispute.findOne({
      where: { id: disputeId },
      include: [
        { 
          model: models.Order,
          include: [{ 
            model: models.User,
            where: { role: 'seller' },
            attributes: ['name', 'email', 'phone']
          }]
        }
      ]
    });

    await sendEmail({
      to: dispute.Order.User.email,
      subject: 'Nouveau litige client',
      template: 'seller-dispute-notification',
      data: {
        orderNumber: dispute.Order.orderNumber,
        orderDate: formatDate(dispute.Order.createdAt),
        customerName: dispute.customerName,
        orderAmount: dispute.Order.total,
        disputeReason: dispute.reason,
        customerMessage: dispute.message,
        disputeUrl: `${process.env.FRONTEND_URL}/seller/disputes/${dispute.id}`
      }
    });

    // SMS urgent
    if (dispute.Order.User.phone) {
      await sendSMS({
        to: dispute.Order.User.phone,
        template: 'seller-dispute',
        data: {
          orderNumber: dispute.Order.orderNumber
        }
      });
    }
  } catch (error) {
    console.error('Erreur notification litige:', error);
  }
};

// Autres notifications...
export const sendStockAlert = async (sellerId, products) => {
  try {
    const seller = await models.Seller.findByPk(sellerId, {
      include: [{ model: models.User }]
    });

    await sendEmail({
      to: seller.User.email,
      subject: 'Alerte stock bas',
      template: 'seller-stock-alert',
      data: {
        products: products.map(p => ({
          name: p.name,
          stock: p.stock,
          image: p.images[0]
        })),
        inventoryUrl: `${process.env.FRONTEND_URL}/seller/dashboard/inventory`
      }
    });
  } catch (error) {
    console.error('Erreur alerte stock:', error);
  }
}; 