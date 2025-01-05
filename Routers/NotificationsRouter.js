import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import notificationsController from '../Controllers/NotificationsController.js';

const router = express.Router();

// Protéger toutes les routes avec le middleware d'authentification
router.use(protect);

// Routes pour les notifications
router.get('/', notificationsController.getSellerNotifications);
router.put('/:notificationId/mark-read', notificationsController.markNotificationAsRead);
router.put('/mark-all-read', notificationsController.markAllNotificationsAsRead);

export default router; 