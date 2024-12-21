import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sellerMiddleware } from '../middleware/sellerMiddleware.js';
import * as SellerController from '../Controllers/Sellers.js';

const router = express.Router();

// Configuration multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let path = 'uploads/';
    switch (file.fieldname) {
      case 'idCard':
      case 'proofOfAddress':
      case 'taxCertificate':
        path += 'documents/';
        break;
      case 'photos':
        path += 'photos/';
        break;
      case 'signedDocument':
        path += 'contracts/';
        break;
      case 'verificationVideo':
        path += 'videos/';
        break;
      default:
        path += 'others/';
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Routes publiques
router.get('/check-validation', authMiddleware, SellerController.checkValidationStatus);

// Routes protégées vendeur
router.use(authMiddleware, sellerMiddleware);
router.get('/dashboard/stats', SellerController.getDashboardStats);
router.get('/products', SellerController.getSellerProducts);
router.post('/products', upload.array('images', 5), SellerController.createProduct);
router.put('/products/:id', upload.array('images', 5), SellerController.updateProduct);
router.delete('/products/:id', SellerController.deleteProduct);
router.get('/orders', SellerController.getSellerOrders);

// Routes d'onboarding
router.post('/register', 
  authMiddleware,
  upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'proofOfAddress', maxCount: 1 },
    { name: 'taxCertificate', maxCount: 1 },
    { name: 'photos', maxCount: 5 },
    { name: 'rccm', maxCount: 1 },
    { name: 'companyStatutes', maxCount: 1 },
    { name: 'signedDocument', maxCount: 1 },
    { name: 'verificationVideo', maxCount: 1 }
  ]), 
  SellerController.registerSeller
);

// Routes de gestion du compte vendeur
router.get('/profile', SellerController.getSellerProfile);
router.put('/profile', upload.single('photo'), SellerController.updateSellerProfile);
router.post('/subscription/trial', SellerController.startFreeTrial);
router.get('/subscription/status', SellerController.checkSubscriptionStatus);

// Routes de gestion des commandes
router.get('/orders/pending', SellerController.getPendingOrders);
router.put('/orders/:orderId/status', SellerController.updateOrderStatus);
router.get('/orders/stats', SellerController.getOrderStats);

// Routes de gestion des produits
router.get('/products/categories', SellerController.getProductCategories);
router.post('/products/bulk-update', SellerController.bulkUpdateProducts);
router.get('/products/stats', SellerController.getProductStats);

// Routes de gestion des clients
router.get('/customers', SellerController.getCustomers);
router.get('/customers/:id', SellerController.getCustomerDetails);
router.get('/customers/stats', SellerController.getCustomerStats);

// Routes de gestion des paiements
router.get('/payments', SellerController.getPayments);
router.get('/payments/stats', SellerController.getPaymentStats);
router.post('/payments/withdraw', SellerController.requestWithdrawal);

// Routes de gestion des avis
router.get('/reviews', SellerController.getSellerReviews);
router.post('/reviews/:id/reply', SellerController.replyToReview);

export default router; 