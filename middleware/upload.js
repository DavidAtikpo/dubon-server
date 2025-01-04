import multer from 'multer';
import path from 'path';

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Les fichiers seront sauvegardés dans le dossier 'uploads'
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`) // Nom du fichier: timestamp-nomoriginal
  }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Seules les images sont autorisées!'));
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // Limite de 5MB
  },
  fileFilter: fileFilter
});

export default upload;
