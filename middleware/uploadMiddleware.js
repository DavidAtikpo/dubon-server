import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/identity',
    'uploads/business',
    'uploads/tax',
    'uploads/photos',
    'uploads/documents',
    'uploads/videos',
    'uploads/other'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Créer les dossiers au démarrage
createUploadDirs();

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Traitement du fichier:', file.fieldname, file.originalname);
    
    // Définir le dossier de destination selon le type de document
    let uploadPath = 'uploads/';
    
    switch (file.fieldname) {
      case 'idCard':
        uploadPath += 'identity/';
        break;
      case 'proofOfAddress':
      case 'taxCertificate':
      case 'rccm':
      case 'companyStatutes':
        uploadPath += 'documents/';
        break;
      case 'photos':
      case 'shopImage':
        uploadPath += 'photos/';
        break;
      case 'verificationVideo':
        uploadPath += 'videos/';
        break;
      default:
        uploadPath += 'other/';
    }
    
    console.log('Dossier de destination:', uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log('Nom du fichier généré:', filename);
    cb(null, filename);
  }
});

// Filtre des fichiers
const fileFilter = (req, file, cb) => {
  console.log('Vérification du type de fichier:', file.fieldname, file.mimetype);
  
  // Définir les types de fichiers autorisés par champ
  const allowedTypes = {
    'idCard': ['image/jpeg', 'image/png', 'application/pdf'],
    'proofOfAddress': ['application/pdf', 'image/jpeg', 'image/png'],
    'taxCertificate': ['application/pdf', 'image/jpeg', 'image/png'],
    'rccm': ['application/pdf', 'image/jpeg', 'image/png'],
    'companyStatutes': ['application/pdf', 'image/jpeg', 'image/png'],
    'photos': ['image/jpeg', 'image/png'],
    'shopImage': ['image/jpeg', 'image/png'],
    'verificationVideo': ['video/mp4', 'video/quicktime', 'video/x-msvideo']
  };

  const allowed = allowedTypes[file.fieldname] || ['image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowed.includes(file.mimetype)) {
    console.log('Type de fichier accepté');
    cb(null, true);
  } else {
    console.log('Type de fichier refusé');
    cb(new Error(`Type de fichier non autorisé pour ${file.fieldname}. Types acceptés : ${allowed.join(', ')}`), false);
  }
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Maximum 10 fichiers simultanés
  }
});

// Middleware de gestion des erreurs
const handleUploadError = (err, req, res, next) => {
  console.error('Erreur lors du traitement des fichiers:', err);
  
  if (err instanceof multer.MulterError) {
    console.log('Erreur Multer:', err.code);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Le fichier est trop volumineux. Taille maximum : 10MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers envoyés'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Type de fichier non attendu'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Erreur lors de l'upload: ${err.message}`
    });
  }
  
  if (err.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  console.error('Erreur non gérée:', err);
  next(err);
};

export { upload, handleUploadError }; 