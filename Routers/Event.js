import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as eventController from "../Controllers/EventController.js";
import upload from "../middleware/uploadEvent.js";

const router = express.Router();

// Route publique pour récupérer les événements
router.get("/public", eventController.getEvents);

// Routes protégées pour la gestion des événements
router.post("/create", protect, upload.array('images', 5), eventController.createEvent);
router.get("/seller/events", protect, eventController.getSellerEvents);
router.put("/:eventId", protect, upload.array('images', 5), eventController.updateEvent);
router.delete("/:eventId", protect, eventController.deleteEvent);
router.get("/details/:eventId", eventController.getDetailEvent);
router.post("/request/:eventId", eventController.eventRequest);

export default router;
