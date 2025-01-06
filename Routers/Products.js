import express from 'express'
import productsController, { createProduct } from '../Controllers/Products.js'
import { protect } from '../middleware/authMiddleware.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isDigital = req.body.isDigital === 'true' && file.fieldname === 'digitalFiles'
    const uploadPath = isDigital ? './uploads/digital' : './uploads/products'
    cb(null, uploadPath)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Format de fichier non supporté. Seules les images sont acceptées.'), false)
    }
  } else if (file.fieldname === 'digitalFiles') {
    const allowedMimes = ['application/pdf', 'application/zip', 'application/x-zip-compressed']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Format de fichier digital non supporté.'), false)
    }
  } else {
    cb(null, false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Maximum 10 fichiers
  }
})

// Routes publiques
router.get('/get-all', productsController.getAllPublicProducts);
router.get('/quick-sale', productsController.getQuickSales);
router.get('/top-rate', productsController.getTopRated);
router.get('/best-sellers', productsController.getBestSellers);
router.get('/new-arrival', productsController.getNewArrivals);
router.get('/promotion', productsController.Promotion);
router.get('/new-product', productsController.getNewProduct);
router.get('/product-detail/:productId', productsController.getProductById);
router.get('/category/:category', productsController.getProductsByCategory);

// Routes protégées
router.use(protect);
router.get('/seller/products', productsController.getSellerProducts);
router.post('/create', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'digitalFiles', maxCount: 5 }
]), createProduct);
router.put('/update-product/:productId', productsController.updateProduct);
router.delete('/delete-product/:productId', productsController.deleteProduct);

export default router
