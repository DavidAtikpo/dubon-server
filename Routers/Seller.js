import express from "express";
import multer from 'multer';
import path from 'path';
import * as SellerController from "../Controllers/Sellers.js";
import { verifyToken, isAdmin, verifyAdmin, corsErrorHandler } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    switch (file.fieldname) {
      case 'idCard':
        uploadPath += 'documents/id';
        break;
      case 'proofOfAddress':
        uploadPath += 'documents/address';
        break;
      case 'taxCertificate':
        uploadPath += 'documents/tax';
        break;
      case 'photos':
        uploadPath += 'photos';
        break;
      case 'signedDocument':
        uploadPath += 'contracts';
        break;
      case 'verificationVideo':
        uploadPath += 'videos';
        break;
      case 'productImages':
        uploadPath += 'products';
        break;
      default:
        uploadPath += 'others';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    fieldSize: 100 * 1024 * 1024, // 100MB max field size
    files: 10 // maximum 10 fichiers
  }
});

const uploadFields = upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
  { name: 'signedDocument', maxCount: 1 },
  { name: 'verificationVideo', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// Configuration multer pour les produits
const productStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const productUpload = multer({ 
  storage: productStorage,
  limits: {
    fileSize: file => {
      // 50MB pour les vidéos, 10MB pour les images
      if (file.fieldname === 'video') {
        return 50 * 1024 * 1024; // 50MB
      }
      return 10 * 1024 * 1024; // 10MB
    },
    files: 6 // 5 images + 1 vidéo
  },
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'video') {
      // Vérifier le type de vidéo
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les vidéos sont autorisées pour le champ video'), false);
      }
    } else if (file.fieldname === 'images') {
      // Vérifier le type d'image
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Seules les images sont autorisées pour le champ images'), false);
      }
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  }
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]);

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const fieldname = err.field;
      const message = fieldname === 'video' 
        ? "La taille de la vidéo ne doit pas dépasser 50MB"
        : "La taille de l'image ne doit pas dépasser 10MB";
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${err.message}`,
      code: err.code
    });
  }
  if (err.message.includes('Seules les')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next(err);
};

// Routes spécifiques AVANT les routes avec paramètres dynamiques
router.get("/validation-status", verifyToken, SellerController.checkValidationStatus);
router.get("/all-requests", verifyAdmin, SellerController.getAllSellerRequests);
router.get("/all-sellers", verifyAdmin, SellerController.getAllSellers);
router.post("/register", verifyToken, uploadFields, handleMulterError, SellerController.registerSeller);

// Modifier la route des produits
router.post("/products", verifyToken, (req, res, next) => {
  productUpload(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
}, SellerController.createProduct);
router.get("/products", verifyToken, SellerController.getSellerProducts);

// Routes avec paramètres dynamiques APRÈS
router.get("/data/:id", verifyToken, SellerController.getSellerData);
router.get("/details/:id", verifyAdmin, SellerController.getSellerById);
router.post("/block/:id", verifyAdmin, SellerController.blockSeller);
router.post("/unblock/:id", verifyAdmin, SellerController.unblockSeller);
router.post("/trial/:id", verifyToken, SellerController.startFreeTrial);
router.get("/trial-status/:id", verifyToken, SellerController.checkTrialStatus);
router.post("/subscription/:id", verifyToken, SellerController.paySubscription);

// Ajouter la gestion des erreurs CORS
router.use(corsErrorHandler);

router.delete('/products/:productId', verifyToken, SellerController.deleteProduct);
router.put('/products/:productId', verifyToken, SellerController.updateProduct);

router.get('/orders', verifyToken, SellerController.getSellerOrders);

export default router;

