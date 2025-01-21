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

// Routes protégées
router.use(protect);
router.get('/seller/products', productsController.getSellerProducts);

// Route pour créer un produit
router.post('/create', uploadProduct.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), createProduct);

// Route pour mettre à jour un produit
router.put('/update-product/:id', uploadProduct.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), productsController.updateProduct);

router.delete('/delete-product/:productId', productsController.deleteProduct);
router.get('/shop/:shopId', productsController.getShopProducts);

export default router;
