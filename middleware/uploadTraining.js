import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';



// Configuration de base de Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration du stockage pour les différents types de fichiers
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: (req, file) => {
      if (file.fieldname === 'image') {
        return 'dubon/trainings/images';
      } else if (file.fieldname === 'syllabus') {
        return 'dubon/trainings/syllabus';
      }
      return 'dubon/trainings/others';
    },
    allowed_formats: (req, file) => {
      if (file.fieldname === 'image') {
        return ['jpg', 'jpeg', 'png', 'gif'];
      } else if (file.fieldname === 'syllabus') {
        return ['pdf'];
      }
      return ['jpg', 'jpeg', 'png', 'pdf'];
    },
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }
    ]
  }
});

// Configuration de Multer avec les restrictions de fichiers
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Seules les images sont acceptées.'), false);
    }
  } else if (file.fieldname === 'syllabus') {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Seuls les PDF sont acceptés.'), false);
    }
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

export default upload; 