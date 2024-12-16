import express from 'express'
import productsController from '../Controllers/Products.js'
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()
// router.post('/add-product',authMiddleware.authorization,Products.createProduct);
router.post('/new-product',productsController.addProduct)
router.get('/promotion',productsController.Promotion);
router.get('/get-all',productsController.getAllProducts);
router.get('/quick-sele',productsController.getQuickSales);
router.get('/top-rate', productsController.getTopRated);
router.get('/best-sellers',productsController.getBestSellers);
router.get('/new-arrival',productsController.getNewArrivals);
router.get('/product-detail/:productId',productsController.getProductById);
router.get('/new-product',productsController.getNewProduct);
router.get('/category/:category',productsController.getProductsByCategory);

router.delete('/delete-product/:productId',productsController.deleteProduct);
router.put('/update-product/:productId',productsController.updateProduct);


export default router;




// import express from 'express';
// import productCtrl from '../controllers/productCtrl.js';
// import middleware from '../middleware/authMiddleware.js';
// import upload from '../middleware/upload.js';
// import productController from '../controllers/productController.js'

// const router = express.Router();

// // Route pour ajouter un produit avec téléchargement d'images
// router.post('/add-products', upload.array('images', 10), productController.createProduct);

// // Autres routes pour manipuler les produits
// router.get('/get-product/:productId', productController.getProductById);
// router.get('/',productController.getAllProduct);
// router.get('/getNewProduct',productController.getNewProduct)
// router.put('/update-product/:productId',productController.updateProduct)
// router.get('/category/:category',productController.getProductsByCategory);
// // router.put('/:id', middleware.authMiddleware, middleware.isAdmin, productCtrl.updateProduct);
// // router.delete('/:id', middleware.authMiddleware, middleware.isAdmin, productCtrl.deleteProduct);
// router.delete('/delete-product/:productId',productController.deleteProduct)

// export default router;
