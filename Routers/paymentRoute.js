import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import PaymentController from '../Controllers/paymentController.js';

const router = express.Router();

// Route pour créer une transaction de paiement
router.post('/create', protect, PaymentController.createPayment);

// Route pour le callback de FedaPay (pas besoin de protection car appelé par FedaPay)
router.post('/callback/:orderId', PaymentController.handlePaymentCallback);

// Route pour vérifier le statut d'un paiement
// router.get('/status/:transactionId', PaymentController.checkPaymentStatus);

export default router; 