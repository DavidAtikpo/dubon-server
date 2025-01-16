import express from 'express'
import productsController, { createProduct } from '../Controllers/Products.js'
import { protect } from '../middleware/authMiddleware.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'images') {
      uploadPath = './uploads/products';
    } else if (file.fieldname === 'video') {
      uploadPath = './uploads/videos';
    } else if (file.fieldname === 'digitalFiles') {
      uploadPath = './uploads/digital';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Seules les images sont acceptées.'), false);
    }
  } else if (file.fieldname === 'video') {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de vidéo non supporté.'), false);
    }
  } else if (file.fieldname === 'digitalFiles') {
    const allowedMimes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier digital non supporté.'), false);
    }
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max pour les vidéos
    files: 10 // Maximum 10 fichiers
  }
});

// Routes publiques
router.get('/get-all', productsController.getAllPublicProducts);
router.get('/quick-sale', productsController.getQuickSales);
router.get('/top-rate', productsController.getTopRated);
router.get('/best-sellers', productsController.getBestSellers);
router.get('/new-arrival', productsController.getNewArrivals);
router.get('/promotion', productsController.Promotion);
router.get('/new-product', productsController.getNewProduct);
router.get('/product-detail/:productId', productsController.getProductById);
// router.get('/category/name/:categoryName', productsController.getProductsByCategoryName);
router.get('/category/:category', productsController.getProductsByCategory);
router.get('/category/id/:categoryId', productsController.getProductsByCategoryId);

// Routes protégées
router.use(protect);
router.get('/seller/products', productsController.getSellerProducts);
router.post('/create', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), createProduct);
router.put('/update-product/:id', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 },
  { name: 'digitalFiles', maxCount: 5 }
]), productsController.updateProduct);
router.delete('/delete-product/:productId', productsController.deleteProduct);

router.get('/shop/:shopId', productsController.getShopProducts);



export default router
