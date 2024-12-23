import express from 'express'
import { protect, admin } from '../middleware/authMiddleware.js';
import * as userController from '../Controllers/User.js';
import { uploadMiddleware } from '../middleware/upload.js';


const router = express.Router()

// Routes publiques
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password/:token', userController.resetPassword);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerificationEmail);

// Routes protégées (utilisateur connecté)
router.use(protect);

// Profil et paramètres
router.get('/profile', userController.getUserProfile);
router.put('/profile', 
  protect, 
  uploadMiddleware.single('profilePhoto'),
  userController.updateUserProfile
);
router.put('/password', userController.updatePassword);
router.post('/logout', protect, userController.logout);

// Adresses
router.get('/addresses', userController.getUserAddresses);
router.post('/address', userController.addUserAddress);
router.put('/address/:id', userController.updateUserAddress);
router.delete('/address/:id', userController.deleteUserAddress);

// Commandes et historique
router.get('/orders', userController.getUserOrders);
router.get('/order/:id', userController.getOrderDetails);

// Favoris et préférences
router.get('/favorites', userController.getFavorites);
router.post('/favorites/toggle', userController.toggleFavorite);
router.put('/preferences', userController.updateUserPreferences);

// Notifications
router.get('/notifications', userController.getUserNotifications);
router.put('/notifications/read', userController.markNotificationsAsRead);
router.put('/notification-settings', userController.updateNotificationSettings);

// Activité et statistiques
router.get('/activity', userController.getUserActivity);
router.get('/stats', userController.getUserStats);

// Routes admin (gestion des utilisateurs)
router.use(admin);
router.get('/all', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);

export default router