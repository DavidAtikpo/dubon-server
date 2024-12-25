import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as adminController from '../Controllers/Admin.js';
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Routes publiques (pas besoin d'authentification)
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshAdminToken);

// Appliquer les middlewares d'authentification pour toutes les routes suivantes
router.use(protect);  // Vérifie le token
router.use(admin);    // Vérifie le rôle admin

// Routes du dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/stats', adminController.getDashboardStats);  // Retiré authMiddleware car déjà protégé

// Gestion des utilisateurs
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);

// Gestion des vendeurs
router.get('/sellers', adminController.getSellers);
router.get('/sellers/:id', adminController.getSellerById);

// Gestion des commandes
router.get('/orders', adminController.getOrders);

// Paramètres système
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);

// Logs système
router.get('/logs', adminController.getSystemLogs);

router.use(corsErrorHandler);

export default router;
