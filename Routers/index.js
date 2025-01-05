import express from 'express';
import authRouter from './Auth.js';
import productsRouter from './Products.js';
import sellerRouter from './Seller.js';
import notificationsRouter from './NotificationsRouter.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/products', productsRouter);
router.use('/seller', sellerRouter);
router.use('/notifications', notificationsRouter);

export default router; 