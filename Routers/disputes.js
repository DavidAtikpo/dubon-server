import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as DisputeController from '../Controllers/DisputeController.js';

const router = express.Router();

// Routes protégées (utilisateur authentifié)
router.use(protect);

// Routes pour les utilisateurs
router.post('/create', DisputeController.createDispute);
router.get('/my-disputes', DisputeController.getUserDisputes);
router.get('/:id', DisputeController.getDisputeDetails);
router.post('/:id/message', DisputeController.addDisputeMessage);

// Routes admin
router.use(admin);
router.get('/all', DisputeController.getAllDisputes);
router.put('/:id/status', DisputeController.updateDisputeStatus);
router.post('/:id/resolve', DisputeController.resolveDispute);

export default router; 