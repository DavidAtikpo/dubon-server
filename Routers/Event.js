import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as eventController from "../Controllers/EventController.js";
import upload from "../middleware/uploadEvent.js";

const router = express.Router();

// Route publique pour récupérer les événements
router.get("/public", eventController.getEvents);
router.get("/:eventId/detail", eventController.getDetailEvent);

// Routes protégées pour la gestion des événements
router.post("/create", protect, upload.array('images', 5), eventController.createEvent);
router.get("/seller/events", protect, eventController.getSellerEvents);
router.put("/:eventId", protect, upload.array('images', 5), eventController.updateEvent);
router.delete("/:eventId", protect, eventController.deleteEvent);

// Route pour les demandes d'événements
router.post("/request/:eventId", protect, eventController.eventRequest);
router.get("/requests/user", protect, eventController.getUserEventRequests);

export default router;
