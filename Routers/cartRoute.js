import express from 'express';
import cartCtrl from '../Controllers/cartCtrl.js';

const router = express.Router();

router.post('/add',cartCtrl.addToCart);
router.post('/remove',cartCtrl.removeFromCart);
router.post('/update',cartCtrl.updateCartQuantity);

export default router;
