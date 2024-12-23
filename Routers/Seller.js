import express from "express";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as SellerController from "../Controllers/Sellers.js";
import { protect, admin, seller } from "../middleware/authMiddleware.js";
import { validateSellerRegistration } from "../middleware/sellerValidator.js";
import { corsErrorHandler } from '../middleware/errorHandlers.js';

const router = express.Router();

// Créer les dossiers d'upload s'ils n'existent pas
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

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Vérifier les types de fichiers
    if (file.fieldname === 'verificationVideo') {
      if (!file.mimetype.startsWith('video/')) {
        return cb(new Error('Seules les vidéos sont autorisées'));
      }
    } else if (file.fieldname === 'photos' || file.fieldname === 'productImages' || file.fieldname === 'idCard') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Seules les images sont autorisées'));
      }
    } else if (file.fieldname === 'proofOfAddress' || file.fieldname === 'taxCertificate' || file.fieldname === 'signedDocument') {
      if (!file.mimetype.startsWith('application/pdf') && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Seuls les PDF et images sont autorisés'));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

// Routes publiques
router.get('/list', SellerController.getPublicSellers);
router.get('/categories', SellerController.getSellerCategories);

// Routes protégées (utilisateur authentifié)
router.use(protect);

// Validation et inscription
router.get("/validation-status", SellerController.checkValidationStatus);
router.post("/register", protect,
  upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'taxCertificate', maxCount: 1 },
    { name: 'photos', maxCount: 5 },
    { name: 'signedDocument', maxCount: 1 },
    { name: 'verificationVideo', maxCount: 1 }
  ]),
  validateSellerRegistration,
  SellerController.registerSeller
);

// Routes vendeur
router.use(seller);

// Profil et paramètres
router.get('/profile', SellerController.getProfile);
// router.put('/profile', upload.single('logo'), SellerController.updateProfile);

// Gestion des produits
router.post('/products', upload.array('images', 5), SellerController.createProduct);
router.get('/products', SellerController.getSellerProducts);
router.put('/products/:id', upload.array('images', 5), SellerController.updateProduct);
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

