import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as SystemController from '../Controllers/SystemController.js';

const router = express.Router();

// Routes protégées par authentification
router.use(protect);

// Routes de base (utilisateur authentifié)
router.get('/health', SystemController.getSystemHealth);
router.get('/version', SystemController.getSystemVersion);
router.get('/stats/basic', SystemController.getBasicStats);

// Routes admin uniquement
router.use(admin);

// Routes d'administration système
router.get('/stats/detailed', SystemController.getDetailedStats);
router.get('/logs', SystemController.getSystemLogs);
router.get('/performance', SystemController.getPerformanceMetrics);
router.get('/storage', SystemController.getStorageInfo);
router.get('/users/active', SystemController.getActiveUsers);
router.get('/errors', SystemController.getErrorLogs);

// Maintenance système
router.post('/maintenance/start', SystemController.startMaintenance);
router.post('/maintenance/end', SystemController.endMaintenance);
router.post('/cache/clear', SystemController.clearCache);
router.post('/optimize', SystemController.optimizeSystem);

// Sauvegardes
router.post('/backup', SystemController.createBackup);
router.get('/backup/list', SystemController.listBackups);
router.post('/backup/restore/:id', SystemController.restoreBackup);

export default router; 