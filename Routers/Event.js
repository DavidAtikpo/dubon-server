import express from "express";
import Event from '../Controllers/Event.js'
const router = express.Router();

// Routes CRUD pour les événements
router.post("/create-event", Event.createEvent);
router.get("/get-all-event", Event.getAllEvents);
router.get("/get/:id", Event.getEventById);
router.put("/update-event/:id", Event.updateEvent);
router.delete("/delete-event/:id", Event.deleteEvent);

// Route pour ajouter un participant à un événement
router.post("/:id/participants", Event.addParticipant);

export default router;
