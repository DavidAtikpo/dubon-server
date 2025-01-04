import express from 'express';
import * as shopController from '../Controllers/ShopController.js';

const router = express.Router();

router.get('/featured', shopController.getFeaturedShops);

export default router; 