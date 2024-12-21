import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import * as AdminController from '../Controllers/AdminController.js';

const router = express.Router();

// Routes publiques
router.post('/login', AdminController.adminLogin);

// Routes protégées
router.use(authMiddleware, adminMiddleware);

// Dashboard et statistiques
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/stats', AdminController.getAdminStats);
router.get('/analytics', AdminController.getAnalytics);

// Gestion des vendeurs
router.get('/sellers/requests', AdminController.getSellerRequests);
router.put('/sellers/requests/:id', AdminController.updateSellerRequest);

// Gestion des utilisateurs
router.put('/users/:id', AdminController.manageUser);

// Gestion des produits
router.post('/products/manage', AdminController.manageProducts);

// Gestion des avis
router.put('/reviews/:id/moderate', AdminController.moderateReview);

// Logs système
router.get('/logs', AdminController.getSystemLogs);

// Paramètres système
router.get('/settings', AdminController.getAdminSettings);
router.put('/settings', AdminController.updateAdminSettings);

// Notifications
router.get('/notifications', AdminController.getAdminNotifications);

export default router; 