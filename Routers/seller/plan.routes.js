import express from 'express';
import { getPlans } from '../../Controllers/PlanController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Route pour récupérer tous les plans
router.get('/', protect, getPlans);

export default router; 