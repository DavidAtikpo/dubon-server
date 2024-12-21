import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import * as ThemeController from '../Controllers/ThemeController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/themes/' });

router.use(authMiddleware, adminMiddleware);

router.get('/', ThemeController.getThemes);
router.post('/:id/activate', ThemeController.activateTheme);
router.delete('/:id', ThemeController.deleteTheme);
router.post('/upload', upload.single('theme'), ThemeController.uploadTheme);

export default router; 