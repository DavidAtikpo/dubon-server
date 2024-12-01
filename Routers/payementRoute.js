import express from 'express';

const router = express.Router();
import { 
  createFedaPayPayment,
  createPayPalPayment,
  createStripePayment,
  handleWebhook 
} from'../Controllers/paymentController.js';

// Routes de paiement
router.post('/fedapay/create', createFedaPayPayment);
router.post('/paypal/create', createPayPalPayment);
router.post('/stripe/create', createStripePayment);
router.post('/webhook', handleWebhook);

export default router;