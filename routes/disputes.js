import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sellerMiddleware } from '../middleware/sellerMiddleware.js';
import * as DisputeController from '../Controllers/DisputeController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// Routes client
router.post('/', authMiddleware, DisputeController.createDispute);

// Routes vendeur
router.use(authMiddleware, sellerMiddleware);
router.get('/', DisputeController.getSellerDisputes);
router.get('/stats', DisputeController.getDisputeStats);
router.post('/:id/respond', DisputeController.respondToDispute);
router.post('/:id/resolve', DisputeController.resolveDispute);

// Routes pour les preuves
router.post('/:disputeId/evidence', 
  upload.array('files', 5), 
  DisputeController.addEvidence
);

// Routes pour l'escalade
router.post('/:id/escalate', DisputeController.escalateDispute);

// Routes pour l'historique
router.get('/:id/history', DisputeController.getDisputeHistory);

export default router; 