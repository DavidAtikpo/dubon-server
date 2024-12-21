import express from'express';
import PaymentController from '../Controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/initialize', protect, PaymentController.initializePayment);
router.post('/confirm', protect, PaymentController.confirmPayment);

export default router;