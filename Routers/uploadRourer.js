import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configuration de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Endpoint pour téléverser un fichier
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Erreur lors du téléversement :", error);
    res.status(500).json({ error: "Erreur lors du téléversement du fichier." });
  }
});

export default router;
