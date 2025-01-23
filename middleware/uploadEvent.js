import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration du stockage Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dubon/event', // Dossier dans Cloudinary où seront stockées les images
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif','mp4'], // Formats autorisés
    transformation: [{ 
      width: 1200, // Redimensionnement max
      height: 1200,
      crop: 'limit'
    }]
  }
});

// Configuration de Multer avec le stockage Cloudinary
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées!'), false);
    }
    cb(null, true);
  }
});

export default upload; 