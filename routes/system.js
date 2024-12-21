import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import * as SystemController from '../Controllers/SystemController.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/info', SystemController.getSystemInfo);
router.post('/cache/clear', SystemController.clearCache);
router.post('/email/test', SystemController.testEmail);
router.post('/security/scan', SystemController.securityScan);
router.post('/backup', SystemController.createBackup);
router.post('/optimize', SystemController.optimizeSystem);
router.get('/metrics', SystemController.getPerformanceMetrics);
router.get('/logs', SystemController.getSystemLogs);
router.post('/maintenance/start', SystemController.startMaintenance);
router.post('/maintenance/end', SystemController.endMaintenance);
router.post('/cleanup', SystemController.cleanupSystem);

export default router; 