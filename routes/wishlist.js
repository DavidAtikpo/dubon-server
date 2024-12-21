import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as WishlistController from '../Controllers/WishlistController.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Routes de la liste de souhaits
router.get('/', WishlistController.getWishlist);
router.post('/add/:productId', WishlistController.addToWishlist);
router.delete('/remove/:productId', WishlistController.removeFromWishlist);
router.delete('/clear', WishlistController.clearWishlist);

export default router; 