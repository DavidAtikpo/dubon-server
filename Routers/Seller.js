import express from "express";
import multer from 'multer';
import path from 'path';
import * as SellerController from "../Controllers/Sellers.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

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

// Route spécifique pour les produits avec son propre middleware multer
const productUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max pour les images
}).array('productImages', 5);

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Erreur d'upload: ${err.message}`,
      code: err.code
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
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Erreur d'upload: ${err.message}`
      });
    } else if (err) {
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'upload des images"
      });
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

export default router;

