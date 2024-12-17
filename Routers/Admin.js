import express from "express";
import * as adminController from "../Controllers/Admin.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { corsErrorHandler } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/login', adminController.login);

// Routes protégées
router.use(authMiddleware);

// Routes de gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/block', adminController.blockUser);
router.put('/users/:id/unblock', adminController.unblockUser);

// Routes de gestion des vendeurs
router.get('/sellers', adminController.getAllSellers);
router.get('/sellers/:id', adminController.getSellerById);
router.put('/sellers/:id/approve', adminController.approveSeller);
router.put('/sellers/:id/reject', adminController.rejectSeller);

// Routes du tableau de bord
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);
router.get('/dashboard/revenue', adminController.getRevenue);

router.get('/verify-login/:token', adminController.verifyLoginToken);
router.post('/verify-login', adminController.verifyLogin);

router.use(corsErrorHandler);

// Ajouter la route d'inscription admin
router.post('/register', adminController.register);

router.get('/approved-sellers', authMiddleware, adminController.getApprovedSellers);

// Routes pour les demandes de vendeurs
router.get('/seller-requests', authMiddleware, adminController.getSellerRequests);
router.post('/seller-requests/:id/approve', authMiddleware, adminController.approveSellerRequest);
router.post('/seller-requests/:id/reject', authMiddleware, adminController.rejectSellerRequest);

export default router;