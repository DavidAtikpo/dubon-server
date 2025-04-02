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

// Configuration de Cloudinary pour les documents du vendeur
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Déterminer le type de ressource en fonction du type de fichier
    const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    
    // Déterminer le dossier en fonction du type de fichier
    let folder = 'dubon/seller/others';
    switch (file.fieldname) {
      case 'idCard':
        folder = 'dubon/seller/documents/id';
        break;
      case 'proofOfAddress':
        folder = 'dubon/seller/documents/address';
        break;
      case 'taxCertificate':
        folder = 'dubon/seller/documents/tax';
        break;
      case 'photos':
        folder = 'dubon/seller/photos';
        break;
      case 'shopImage':
        folder = 'dubon/seller/shop';
        break;
      case 'shopVideo':
        folder = 'dubon/seller/videos';
        break;
      case 'signedDocument':
        folder = 'dubon/seller/contracts';
        break;
      case 'verificationVideo':
        folder = 'dubon/seller/videos';
        break;
    }

    return {
      resource_type: resourceType,
      folder: folder,
      allowed_formats: file.mimetype.startsWith('video/') 
        ? ['mp4', 'mov', 'webm']
        : ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }
      ]
    };
  }
});

// Filtre des fichiers par type
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  const allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  // Vérifier le type de fichier en fonction du champ
  if (file.fieldname === 'photos' || file.fieldname === 'shopImage') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d\'image non supporté. Formats acceptés: JPG, PNG, GIF'), false);
    }
  } else if (file.fieldname === 'shopVideo' || file.fieldname === 'verificationVideo') {
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de vidéo non supporté. Formats acceptés: MP4, MOV, WEBM'), false);
    }
  } else {
    if (allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de document non supporté. Formats acceptés: PDF, JPG, PNG'), false);
    }
  }
};

// Configuration de multer pour les documents du vendeur
const uploadSeller = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
    files: 10 // Maximum 10 fichiers
  }
}).fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'photos', maxCount: 5 },
  { name: 'shopImage', maxCount: 1 },
  { name: 'shopVideo', maxCount: 1 },
  { name: 'rccm', maxCount: 1 },
  { name: 'companyStatutes', maxCount: 1 },
  { name: 'signedDocument', maxCount: 1 },
  { name: 'verificationVideo', maxCount: 1 }
]);

// Configuration pour l'upload de logo uniquement
const uploadLogo = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'dubon/seller/logos',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [
        { width: 200, height: 200, crop: 'fill' }
      ]
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format d\'image non supporté. Formats acceptés: JPG, PNG, GIF'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max pour le logo
  }
}).single('logo');

// Middleware pour gérer les erreurs de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux. La taille maximale est de 100MB.',
        error: err.message
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers. Le maximum est de 10 fichiers.',
        error: err.message
      });
    }
  }
  next(err);
};

export { uploadSeller, uploadLogo, handleMulterError }; 