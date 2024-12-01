import express from 'express';
import WishilistCtrl from '../Controllers/WishilistCtrl.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add-to-wishlist',authMiddleware.authMiddleware, WishilistCtrl.addToWishlist);
router.post('/remove-from-wishlist',authMiddleware.authMiddleware,WishilistCtrl.removeFromWishlist);

export default router;
