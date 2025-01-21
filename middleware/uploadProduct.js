import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Vérification des variables d'environnement Cloudinary
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Les variables d\'environnement Cloudinary sont manquantes');
}

// Configuration de base de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration de Cloudinary pour les produits
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

// Filtre des fichiers par type
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Seules les images sont acceptées.'), false);
    }
  } else if (file.fieldname === 'video') {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
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

// Configuration de multer pour les produits
const uploadProduct = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 10 // Maximum 10 fichiers
  }
});

export default uploadProduct; 