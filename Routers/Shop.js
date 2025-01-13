import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import {
  updateShop,
  getAllShops,
  getShopById,
  getFeaturedShops,
  getSellerShop
} from '../Controllers/ShopController.js';

const router = express.Router();

// Route publique pour obtenir toutes les boutiques
router.get('/get-all', getAllShops);

// Route publique pour obtenir les boutiques en vedette
router.get('/featured', getFeaturedShops);

// Route publique pour obtenir une boutique par son ID
router.get('/:id', getShopById);

// Route protégée pour obtenir la boutique du vendeur connecté
router.get('/seller/shop', protect, getSellerShop);

// Route protégée pour mettre à jour une boutique
router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  updateShop
);

export default router; 