import express from 'express'
import productsController, { createProduct } from '../Controllers/Products.js'
import { protect } from '../middleware/authMiddleware.js'
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const router = express.Router()

// Configuration de Cloudinary pour différents types de fichiers
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'auto',
    folder: (req, file) => {
      if (file.fieldname === 'images') return 'dubon/products/images';
      if (file.fieldname === 'video') return 'dubon/products/videos';
      if (file.fieldname === 'digitalFiles') return 'dubon/products/digital';
      return 'dubon/products/others';
    },
    allowed_formats: (req, file) => {
      if (file.fieldname === 'images') return ['jpg', 'jpeg', 'png', 'gif'];
      if (file.fieldname === 'video') return ['mp4', 'mov', 'webm'];
      if (file.fieldname === 'digitalFiles') return ['pdf', 'zip'];
      return ['jpg', 'jpeg', 'png', 'pdf', 'mp4'];
    },
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
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
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Maximum 10 fichiers
  }
});

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

export default router;
