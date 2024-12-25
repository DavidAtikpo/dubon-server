import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as adminController from '../Controllers/Admin.js';
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Routes publiques
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshAdminToken);

// Routes protégées
router.use(protect);
router.use(admin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/dashboard/stats', adminController.getDashboardStats);

// Gestion des vendeurs et demandes
router.get('/seller-requests', adminController.getSellerRequests);
router.get('/seller-requests/:id', adminController.getSellerRequestById);
router.put('/seller-requests/:id/approve', adminController.approveSellerRequest);
router.put('/seller-requests/:id/reject', adminController.rejectSellerRequest);
router.get('/sellers/pending', adminController.getPendingSellers);
router.get('/sellers/active', adminController.getActiveSellers);

// Autres routes existantes...
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/sellers', adminController.getSellers);
router.get('/sellers/:id', adminController.getSellerById);
router.get('/orders', adminController.getOrders);
router.get('/settings', adminController.getSystemSettings);
router.put('/settings', adminController.updateSystemSettings);
router.get('/logs', adminController.getSystemLogs);

router.use(corsErrorHandler);

export default router;
