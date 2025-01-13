import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as SellerController from "../Controllers/Sellers.js";
import { protect, admin, seller } from "../middleware/authMiddleware.js";
import { validateSellerRegistration } from "../middleware/sellerValidator.js";
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Appliquer les middlewares d'authentification et de vendeur
router.use(protect);
// router.use(seller);

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/documents/id',
    'uploads/documents/address',
    'uploads/documents/tax',
    'uploads/photos',
    'uploads/contracts',
    'uploads/videos',
    'uploads/products',
    'uploads/others'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // max number of files
  }
});

const uploadFields = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
  { name: 'shopImage', maxCount: 1 },
  { name: 'signedDocument', maxCount: 1 },
  { name: 'verificationVideo', maxCount: 1 }
]);

// Public routes
router.get('/list', SellerController.getPublicSellers);

// Protected routes (authenticated user)
router.use(protect);

// Validation and registration
router.get("/validation-status", SellerController.checkValidationStatus);
router.post("/register", uploadFields, validateSellerRegistration, SellerController.registerSeller);

// Seller routes (need seller role)
router.use(seller);

// Payment routes
router.get('/payments/stat', SellerController.getPaymentStats);
router.post('/payments/withdraw', SellerController.requestWithdrawal);

// Profile and settings
router.get('/profile', SellerController.getSellerProfile);
router.put('/profile', upload.single('logo'), SellerController.updateProfile);

// Categories
router.get('/categories', SellerController.getSellerCategories);

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
router.use(admin);
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