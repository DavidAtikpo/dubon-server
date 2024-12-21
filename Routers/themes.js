import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import * as ThemeController from '../Controllers/ThemeController.js';

const router = express.Router();

// Routes publiques
router.get('/active', ThemeController.getActiveTheme);
router.get('/list', ThemeController.getPublicThemes);

// Routes protégées (utilisateur connecté)
router.use(protect);

// Routes de base
router.get('/user-preference', ThemeController.getUserThemePreference);
router.put('/user-preference', ThemeController.updateUserThemePreference);

// Routes admin uniquement
router.use(admin);

// Gestion des thèmes
router.post('/create', ThemeController.createTheme);
router.put('/:id', ThemeController.updateTheme);
router.delete('/:id', ThemeController.deleteTheme);
router.put('/:id/activate', ThemeController.activateTheme);
router.put('/:id/deactivate', ThemeController.deactivateTheme);

export default router; 