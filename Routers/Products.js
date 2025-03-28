import express from 'express'
import productsController, { createProduct } from '../Controllers/Products.js'
import { protect } from '../middleware/authMiddleware.js'
import uploadProduct from '../middleware/uploadProduct.js'

const router = express.Router()

// Routes publiques
router.get('/get-all', productsController.getAllPublicProducts);
router.get('/quick-sale', productsController.getQuickSales);
router.get('/top-rated', productsController.getTopRated);
router.get('/best-sellers', productsController.getBestSellers);
router.get('/new-arrivals', productsController.getNewArrivals);
router.get('/promotion', productsController.Promotion);
router.get('/new-product', productsController.getNewProduct);
router.get('/product-detail/:productId', productsController.getProductById);
router.get('/produits-frais',productsController.getProduitFrais);
router.get('/produits-congeles',productsController.getProduitCongeles);
router.get('/produits-vivriere',productsController.getProduitVivrieres);
router.get('/category/:category', productsController.getProductsByCategory);
router.get('/category/id/:categoryId', productsController.getProductsByCategoryId);
router.get('/by-shop/:shopId', productsController.getShopProducts);

// Routes protégées

// Routes pour les avis et produits associés
router.get('/reviews/:productId', productsController.getProductReviews);
router.get('/similar/:productId', productsController.getSimilarProducts);
router.get('/seller-products/:sellerId', productsController.getSellerProducts);
router.get('/feedback/:productId', productsController.getProductFeedback);

// router.use(protect);
router.get('/seller/products', protect, productsController.getSellerProducts);
// Route pour créer un produit
router.post('/create', protect, uploadProduct.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), createProduct);

// Route pour mettre à jour un produit
router.put('/update-product/:id', protect, uploadProduct.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), productsController.updateProduct);

router.delete('/delete-product/:productId', protect, productsController.deleteProduct);

// Route pour ajouter un avis (protégée)
router.post('/reviews/:productId', protect, productsController.addProductReview);

export default router;
