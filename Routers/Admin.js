import express from "express";
import * as AdminController from "../Controllers/Admin.js";
import Products from "../Controllers/Products.js";
import User from "../Controllers/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { corsErrorHandler } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes pour les demandes de vendeur
router.get('/seller-requests', authMiddleware.verifyAdmin, AdminController.getSellerRequests);
router.post('/seller-requests/:id/approve', authMiddleware.verifyAdmin, AdminController.approveSellerRequest);
router.post('/seller-requests/:id/reject', authMiddleware.verifyAdmin, AdminController.rejectSellerRequest);

// Routes d'authentification admin
router.post('/login', AdminController.adminLogin);
router.post('/register', AdminController.registerAdmin);

// Autres routes admin
router.get('/getorders', AdminController.getOrders);
router.delete('/deleteorder:orderId', AdminController.deleteOrder);
router.get('/getuser', AdminController.getUsers);
router.get('/info', AdminController.userInfo);
router.put('/users/:id', User.blockUser);
router.delete('/user-delete', User.deleteUserById);
router.put('/user-unlck', User.unblockUser);
router.get('/dashboard/stats', authMiddleware.verifyAdmin, AdminController.getDashboardStats);

router.use(corsErrorHandler);

export default router;