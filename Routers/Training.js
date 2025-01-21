import express from "express";
import Training from "../Controllers/Training.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadTraining.js";

const router = express.Router();

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
