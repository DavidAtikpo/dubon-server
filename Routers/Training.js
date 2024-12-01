import express from "express";
import Training from "../Controllers/Training.js";

const router = express.Router();


// router.post("/api/dossier", upload.fields([{ name: "document" }, { name: "signature" }]), Training.createTraining)
router.get("/get-all", Training.getAllTrainings);
router.get("/:trainingId", Training.getTrainingById);
router.put("/:trainingId", Training.updateTraining);
router.delete("/:trainingId", Training.deleteTraining);

// Route pour ajouter un participant
// router.post("/:id", addParticipant);

export default router;
