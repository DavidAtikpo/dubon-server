import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as analyticsController from '../Controllers/AnalyticsController.js';

const router = express.Router();

// Appliquer la protection admin sur toutes les routes
router.use(protect);
router.use(admin);

// Routes analytics
router.get('/', analyticsController.getAnalytics);

export default router; 