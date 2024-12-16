import express from "express";
import * as adminController from "../Controllers/Admin.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { corsErrorHandler } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes d'authentification
router.post('/login', adminController.login);
router.post('/logout', authMiddleware.authMiddleware, adminController.logout);

// Routes de gestion des utilisateurs
router.get('/users', authMiddleware.authMiddleware, adminController.getAllUsers);
router.get('/users/:id', authMiddleware.authMiddleware, adminController.getUserById);
router.put('/users/:id/block', authMiddleware.authMiddleware, adminController.blockUser);
router.put('/users/:id/unblock', authMiddleware.authMiddleware, adminController.unblockUser);

// Routes de gestion des vendeurs
router.get('/sellers', authMiddleware.authMiddleware, adminController.getAllSellers);
router.get('/sellers/:id', authMiddleware.authMiddleware, adminController.getSellerById);
router.put('/sellers/:id/approve', authMiddleware.authMiddleware, adminController.approveSeller);
router.put('/sellers/:id/reject', authMiddleware.authMiddleware, adminController.rejectSeller);

// Routes du tableau de bord
router.get('/dashboard/stats', authMiddleware.authMiddleware, adminController.getDashboardStats);
router.get('/dashboard/recent-orders', authMiddleware.authMiddleware, adminController.getRecentOrders);
router.get('/dashboard/revenue', authMiddleware.authMiddleware, adminController.getRevenue);

router.get('/verify-login/:token', adminController.verifyLoginToken);
router.post('/verify-login', adminController.verifyLogin);

router.use(corsErrorHandler);

// Ajouter la route d'inscription admin
router.post('/register', adminController.register);

export default router;