import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as adminController from '../controllers/Admin.js';
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Routes publiques
router.post('/login', adminController.login);

// Routes protégées
router.use(protect);
router.use(admin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/stats', adminController.getDashboardStats);

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