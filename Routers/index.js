import express from 'express';
import subscriptionRoutes from './seller/subscription.routes.js';

const router = express.Router();

// ... autres routes ...

// Routes de souscription
router.use('/api/seller/subscription', subscriptionRoutes);

export default router; 