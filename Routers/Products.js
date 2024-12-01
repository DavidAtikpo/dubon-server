import express from 'express'
import Products from '../Controllers/Products.js'
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router()
// router.post('/add-product',authMiddleware.authorization,Products.createProduct);
router.post('/new-product',Products.addProduct)
router.get('/promotion',Products.Promotion);
router.get('/get-all',Products.getProducts);
router.get('/quick-sele',Products.getQuickSales);
router.get('/top-rate', Products.getTopRated);
router.get('/best-sellers',Products.getBestSellers);
router.get('/new-arrival',Products.getNewArrivals);
router.get('/product-detail/:productId',Products.getProductById);
router.get('/new-product',Products.getNewProduct);
router.get('/category/:category',Products.getProductsByCategory);

router.delete('/delete-product/:productId',Products.deleteProduct);
router.put('/update-product/:productId',Products.updateProduct);


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
