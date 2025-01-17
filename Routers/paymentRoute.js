import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import PaymentController from '../Controllers/paymentController.js';

const router = express.Router();

// Protéger toutes les routes de paiement
router.use(protect);

// Route pour créer une transaction de paiement
router.post('/create', PaymentController.createPayment);

// Route pour le callback de FedaPay
// router.post('/callback/:orderId', PaymentController.handlePaymentCallback);

// Route pour vérifier le statut d'un paiement
// router.get('/status/:transactionId', PaymentController.checkPaymentStatus);

export default router; 