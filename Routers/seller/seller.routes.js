import express from 'express';
import { authenticateToken } from '../../middleware/auth.js';
import { 
  getSellerDashboard,
  getSellerProfile,
  updateSellerProfile,
  getSellerProducts,
  getSellerOrders,
  getSellerStats
} from '../../Controllers/SellerController.js';

const router = express.Router();

// Routes protégées par authentification
router.use(authenticateToken);

// Routes du tableau de bord vendeur
router.get('/dashboard', getSellerDashboard);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.get('/products', getSellerProducts);
router.get('/orders', getSellerOrders);
router.get('/stats', getSellerStats);

export default router; 