import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Définir le dossier de destination selon le type de document
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'identityDocument') {
      uploadPath += 'identity/';
    } else if (file.fieldname === 'businessLicense') {
      uploadPath += 'business/';
    } else if (file.fieldname === 'taxDocument') {
      uploadPath += 'tax/';
    } else {
      uploadPath += 'other/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  // Vérifier le type de fichier
  const allowedTypes = {
    'identityDocument': ['image/jpeg', 'image/png', 'application/pdf'],
    'businessLicense': ['application/pdf'],
    'taxDocument': ['application/pdf']
  };

  const allowed = allowedTypes[file.fieldname] || ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé pour ${file.fieldname}`), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 3 // Maximum 3 fichiers simultanés
  }
});

// Middleware de gestion des erreurs
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximum : 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers envoyés'
      });
    }
  }
  
  if (err.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

export { upload, handleUploadError }; 