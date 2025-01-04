import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as systemController from '../Controllers/SystemController.js';

const router = express.Router();

// Appliquer la protection admin sur toutes les routes
router.use(protect);
router.use(admin);

// Routes système
router.get('/info', systemController.getSystemInfo);
router.post('/cache/clear', systemController.clearSystemCache);
router.post('/optimize', systemController.optimizeSystem);

export default router; 