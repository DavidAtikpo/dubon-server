import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  initiateSubscription, 
  handlePaymentCallback,
  checkSubscriptionStatus 
} from '../Controllers/SubscriptionController.js';

const router = express.Router();

// Routes publiques
router.post('/callback/:subscriptionId', handlePaymentCallback);

// Routes protégées (nécessitent uniquement l'authentification)
router.get('/status', protect, checkSubscriptionStatus);
router.post('/initiate', protect, initiateSubscription);

export default router; 