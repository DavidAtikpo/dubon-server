import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import * as adminController from '../controllers/Admin.js';

const router = express.Router();

// Appliquer le middleware d'authentification à toutes les routes
router.use(protect);
router.use(adminMiddleware);

// Routes d'administration
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/sellers', adminController.getSellers);
router.get('/orders', adminController.getOrders);
// ... autres routes

export default router; 