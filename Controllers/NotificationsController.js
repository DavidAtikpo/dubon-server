import { models } from '../models/index.js';
const { Notification, SellerProfile } = models;

export const getSellerNotifications = async (req, res) => {
  console.log('🔔 Requête reçue pour getSellerNotifications');
  console.log('User ID:', req.user?.id);
  
  try {
    // Récupérer le profil vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    console.log('Profil vendeur trouvé:', seller?.id || 'Non trouvé');

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Récupérer les notifications du vendeur
    const notifications = await Notification.findAll({
      where: {
        sellerId: seller.id,
      },
      order: [['createdAt', 'DESC']],
      limit: 50 // Limiter aux 50 dernières notifications
    });

    console.log('Nombre de notifications trouvées:', notifications.length);

    // Compter les notifications non lues
    const unreadCount = await Notification.count({
      where: {
        sellerId: seller.id,
        read: false
      }
    });

    console.log('Nombre de notifications non lues:', unreadCount);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('❌ Erreur dans getSellerNotifications:', error);
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
    const notification = await Notification.findByPk(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    // Vérifier que la notification appartient bien au vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller || notification.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette notification"
      });
    }

    // Marquer comme lue
    await notification.update({ read: true });

    res.status(200).json({
      success: true,
      message: "Notification marquée comme lue"
    });
  } catch (error) {
    console.error('Erreur mise à jour notification:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la notification",
      error: error.message
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Profil vendeur non trouvé"
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
    console.error('Erreur mise à jour notifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des notifications",
      error: error.message
    });
  }
};

export default {
  getSellerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
}; 