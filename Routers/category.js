import express from 'express';
import * as categoryController from '../Controllers/CategoryController.js';

const router = express.Router();

// Route publique pour récupérer toutes les catégories
router.get('/all', categoryController.getAllCategories);

// Route pour récupérer une catégorie par ID
router.get('/:id', categoryController.getCategoryById);

// Route pour récupérer les produits d'une catégorie
router.get('/:id/products', categoryController.getProductsByCategory);

export default router;