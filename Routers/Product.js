import express from "express";
import * as ProductController from "../Controllers/Products.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configuration de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    
    // Déterminer le dossier en fonction du type de fichier
    if (file.fieldname === 'digitalFiles') {
      uploadPath += 'digital';
    } else if (file.fieldname === 'images') {
      uploadPath += 'products';
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    // Accepter seulement les images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'), false);
    }
  } else if (file.fieldname === 'digitalFiles') {
    // Ajouter ici les types de fichiers autorisés pour les produits digitaux
    const allowedMimes = ['application/pdf', 'application/zip', 'video/mp4'];
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 15 // Maximum 15 fichiers au total
  }
});

// Configuration des champs de fichiers
const uploadFields = [
  { name: 'images', maxCount: 10 },
  { name: 'digitalFiles', maxCount: 5 }
];

// Routes
router.post('/seller/products',
  authMiddleware,
  upload.fields(uploadFields),
  ProductController.createProduct
);

export default router; 