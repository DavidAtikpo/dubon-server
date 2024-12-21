import express from "express";
import * as ProductController from "../Controllers/Products.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from 'multer';

const router = express.Router();

// Configuration de multer pour les uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'video') {
      uploadPath += 'videos';
    } else {
      uploadPath += 'products';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.post('/',
  authMiddleware,
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ]),
  ProductController.createProduct
);

export default router; 