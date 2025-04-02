import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as SellerController from "../Controllers/Sellers.js";
import { protect, seller } from "../middleware/authMiddleware.js";
import { validateSellerRegistration } from "../middleware/sellerValidator.js";
import { corsErrorHandler } from '../middleware/errorHandlers.js';
import { uploadSeller, uploadLogo, handleMulterError } from '../middleware/uploadSeller.js';

const router = express.Router();

// Appliquer les middlewares d'authentification et de vendeur
// router.use(seller);
// Public routes

// Protected routes (authenticated user)
router.use(protect);
router.post("/post/register", 
  uploadSeller,
  handleMulterError,
  validateSellerRegistration,
  SellerController.registerSeller
);
router.get('/list', SellerController.getPublicSellers);

// Validation and registration
router.get('/categories', SellerController.getSellerCategories);
router.get("/validation-status", SellerController.checkValidationStatus);


// Seller routes (need seller role)
router.use(seller);

// Payment routes
router.get('/payments/stat', SellerController.getPaymentStats);
router.post('/payments/withdraw', SellerController.requestWithdrawal);

// Profile and settings
router.get('/profile', SellerController.getSellerProfile);
router.put('/profile', uploadLogo, handleMulterError, SellerController.updateProfile);

// Categories
// router.get('/categories', SellerController.getSellerCategories);
router.get('/subcategories/:categoryId', SellerController.getSellerSubCategories);

// Product management
router.get('/products', SellerController.getSellerProducts);
router.get('/products/:id', SellerController.getSellerProduct);
// router.put('/products/:id', upload.array('images', 5), SellerController.updateProduct);
router.delete('/products/:id', SellerController.deleteProduct);

// Order management
router.get('/orders', SellerController.getSellerOrders);
router.put('/orders/:id/status', SellerController.updateOrderStatus);

// Statistics and dashboard
router.get('/dashboard', SellerController.getDashboard);
router.get('/stats', SellerController.getStats);
router.get('/analytics', SellerController.getAnalytics);
router.get('/history', SellerController.getSellerHistory);

// Financial management
router.get('/earnings', SellerController.getEarnings);
// router.post('/withdraw', SellerController.requestWithdrawal);
router.get('/transactions', SellerController.getTransactions);

// Promotion management
router.post('/promotions', SellerController.createPromotion);
router.get('/promotions', SellerController.getSellerPromotions);
router.put('/promotions/:id', SellerController.updatePromotion);
router.delete('/promotions/:id', SellerController.deletePromotion);

// Admin routes
// router.use(admin);
router.get('/admin/requests', SellerController.getAllSellerRequests);
router.get('/admin/sellers', SellerController.getAllSellers);
router.get('/admin/seller/:id', SellerController.getSellerById);
router.post('/admin/block/:id', SellerController.blockSeller);
router.post('/admin/unblock/:id', SellerController.unblockSeller);
router.put('/admin/verify/:id', SellerController.verifySeller);
router.put('/admin/status/:id', SellerController.updateSellerStatus);
router.delete('/admin/seller/:id', SellerController.deleteSeller);

// Error handling
router.use(corsErrorHandler);

export default router;