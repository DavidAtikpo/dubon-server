import express from 'express'
import { protect, admin } from '../middleware/authMiddleware.js';
import * as userController from '../Controllers/User.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { login, logout, me } from '../Controllers/AuthController.js';
import { adminlogin } from '../Controllers/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'photos', 'temp');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées'));
  }
});

// Routes publiques
router.post('/register', userController.register);
// router.post('/login', userController.login);
router.post('/login', login);
router.post('/adminlogin',adminlogin)
router.post('/logout', logout);
router.get('/me', me);
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
  upload.single('profilePhoto'),
  userController.updateUserProfile
);
router.put('/password', userController.updatePassword);
// router.post('/logout', protect, userController.logout);

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

// Dashboard (après router.use(protect))
router.get('/dashboard', userController.getDashboard);

// Routes admin (gestion des utilisateurs)
router.use(admin);
router.get('/all', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id/status', userController.updateUserStatus);
router.delete('/:id', userController.deleteUser);

export default router