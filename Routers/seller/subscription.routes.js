import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import { initiateSubscription, handlePaymentCallback } from '../../Controllers/SubscriptionController.js';

const router = express.Router();

// Routes protégées
router.post('/initiate', protect, initiateSubscription);
router.post('/callback/:subscriptionId', handlePaymentCallback);

export default router; 