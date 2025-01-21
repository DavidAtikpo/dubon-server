import express from "express";
import Training from "../Controllers/Training.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Créer les dossiers d'upload s'ils n'existent pas
const createUploadDirs = () => {
  const dirs = [
    'uploads/trainings/images',
    'uploads/trainings/syllabus'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath;
    if (file.fieldname === 'image') {
      uploadPath = './uploads/trainings/images';
    } else if (file.fieldname === 'syllabus') {
      uploadPath = './uploads/trainings/syllabus';
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

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

// Routes
router.post("/create", upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'syllabus', maxCount: 1 }
]), Training.createTraining);

// Route pour les utilisateurs qui voient leurs inscriptions
router.get("/user/my-trainings", protect, Training.getMyTrainings);

// Route pour les formateurs qui voient leurs formations publiées
router.get("/seller/my-published", protect, Training.getMyPublishedTrainings);

router.get("/get-all", Training.getAllTrainings);
router.get("/details/:id", Training.getTrainingById);

router.put("/update/:id", protect, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'syllabus', maxCount: 1 }
]), Training.updateTraining);
router.delete("/delete/:trainingId", Training.deleteTraining);

// Routes pour les participants
router.get("/:id/participants", protect, Training.getTrainingParticipants);
router.put("/participant/:participantId/status", protect, Training.updateParticipantStatus);
router.put("/participant/:participantId/payment", protect, Training.updateParticipantPayment);

// Route pour ajouter un participant
router.post("/register/:trainingId", protect, Training.addParticipant);

export default router;
