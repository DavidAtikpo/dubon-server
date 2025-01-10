import { models } from '../models/index.js';
const { Notification, User, SellerProfile } = models;

export const getSellerNotifications = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user' }]
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé - Profil vendeur non trouvé"
      });
    }

    // Récupérer les notifications avec pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { sellerId: seller.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Compter les notifications non lues
    const unreadCount = await Notification.count({
      where: {
        sellerId: seller.id,
        read: false
      }
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur getSellerNotifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message
    });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    // Récupérer les notifications avec pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Compter les notifications non lues
    const unreadCount = await Notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          total: count,
          page,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erreur getUserNotifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des notifications",
      error: error.message
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Vérifier si l'utilisateur est un vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé - Profil vendeur non trouvé"
      });
    }

    // Trouver et mettre à jour la notification
    const notification = await Notification.findOne({
      where: {
        id: notificationId,
        sellerId: seller.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    await notification.update({ read: true });

    res.status(200).json({
      success: true,
      message: "Notification marquée comme lue"
    });
  } catch (error) {
    console.error('Erreur markNotificationAsRead:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la notification",
      error: error.message
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé - Profil vendeur non trouvé"
      });
    }

    // Marquer toutes les notifications comme lues
    await Notification.update(
      { read: true },
      {
        where: {
          sellerId: seller.id,
          read: false
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Toutes les notifications ont été marquées comme lues"
    });
  } catch (error) {
    console.error('Erreur markAllNotificationsAsRead:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des notifications",
      error: error.message
    });
  }
};

// Fonction utilitaire pour créer une notification
export const createNotification = async (userId, type, message, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      data,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
};

export default {
  getSellerNotifications,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification
}; 