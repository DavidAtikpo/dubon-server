import express from "express";
import multer from 'multer';
import path from 'path';
import * as SellerController from "../Controllers/Sellers.js";
import { protect, admin, seller } from "../middleware/authMiddleware.js";
import { validateSellerRegistration } from "../middleware/sellerValidator.js";
import uploadMiddleware from "../middleware/upload.js";
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    switch (file.fieldname) {
      case 'idCard':
        uploadPath += 'documents/id';
        break;
      case 'proofOfAddress':
        uploadPath += 'documents/address';
        break;
      case 'taxCertificate':
        uploadPath += 'documents/tax';
        break;
      case 'photos':
        uploadPath += 'photos';
        break;
      case 'signedDocument':
        uploadPath += 'contracts';
        break;
      case 'verificationVideo':
        uploadPath += 'videos';
        break;
      case 'productImages':
        uploadPath += 'products';
        break;
      default:
        uploadPath += 'others';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    fieldSize: 100 * 1024 * 1024,
    files: 10
  }
});

// Routes publiques
router.get('/list', SellerController.getPublicSellers);
router.get('/categories', SellerController.getSellerCategories);

// Routes protégées (utilisateur authentifié)
router.use(protect);

// Validation et inscription
router.get("/validation-status", SellerController.checkValidationStatus);
router.post("/register", protect, fileUpload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
  { name: 'signedDocument', maxCount: 1 },
  { name: 'verificationVideo', maxCount: 1 }
]), validateSellerRegistration, SellerController.registerSeller);

// Routes vendeur
router.use(seller);

// Profil et paramètres
router.get('/profile', SellerController.getProfile);
router.put('/profile', uploadMiddleware.single('logo'), SellerController.updateProfile);

// Gestion des produits
router.post('/products', uploadMiddleware.array('images', 5), SellerController.createProduct);
router.get('/products', SellerController.getSellerProducts);
router.put('/products/:id', uploadMiddleware.array('images', 5), SellerController.updateProduct);
router.delete('/products/:id', SellerController.deleteProduct);

// Gestion des commandes
router.get('/orders', SellerController.getSellerOrders);
router.put('/orders/:id/status', SellerController.updateOrderStatus);

// Statistiques et tableau de bord
router.get('/dashboard', SellerController.getDashboard);
router.get('/stats', SellerController.getStats);
router.get('/analytics', SellerController.getAnalytics);

// Gestion financière
router.get('/earnings', SellerController.getEarnings);
router.post('/withdraw', SellerController.requestWithdrawal);
router.get('/transactions', SellerController.getTransactions);

// Gestion des promotions
router.post('/promotions', SellerController.createPromotion);
router.get('/promotions', SellerController.getSellerPromotions);
router.put('/promotions/:id', SellerController.updatePromotion);
router.delete('/promotions/:id', SellerController.deletePromotion);

// Routes admin
router.use('/admin', admin);
router.get('/admin/requests', SellerController.getAllSellerRequests);
router.get('/admin/sellers', SellerController.getAllSellers);
router.get('/admin/seller/:id', SellerController.getSellerById);
router.post('/admin/block/:id', SellerController.blockSeller);
router.post('/admin/unblock/:id', SellerController.unblockSeller);
router.put('/admin/verify/:id', SellerController.verifySeller);
router.put('/admin/status/:id', SellerController.updateSellerStatus);
router.delete('/admin/seller/:id', SellerController.deleteSeller);

// Gestion des erreurs
router.use(corsErrorHandler);

export default router;

