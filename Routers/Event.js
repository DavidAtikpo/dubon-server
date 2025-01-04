import express from "express";
import { protect, seller } from "../middleware/authMiddleware.js";
import * as eventController from "../Controllers/EventController.js";
import multer from "multer";

const router = express.Router();

// Configuration de multer pour le téléchargement d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/events');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage: storage });

// Routes publiques
router.get("/", async (req, res) => {
  try {
    const events = await models.Event.findAll({
      where: { status: 'published' },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['name', 'email']
      }],
      order: [['date', 'ASC']]
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const event = await models.Event.findOne({
      where: { 
        id: req.params.id,
        status: 'published'
      },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['name', 'email']
      }]
    });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Routes protégées pour les vendeurs
router.use(protect);

// Routes pour la création et gestion des événements
router.post("/", 
  seller,
  upload.array('images', 5),
  eventController.createEvent
);

router.get("/seller/events", 
  seller,
  eventController.getSellerEvents
);

router.put("/:eventId", 
  seller,
  upload.array('images', 5),
  eventController.updateEvent
);

router.delete("/:eventId", 
  seller,
  async (req, res) => {
    try {
      const event = await models.Event.findOne({
        where: {
          id: req.params.eventId,
          sellerId: req.user.id
        }
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Événement non trouvé'
        });
      }

      await event.update({ status: 'cancelled' });

      res.json({
        success: true,
        message: 'Événement annulé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Routes pour les réservations
router.post("/:eventId/book",
  eventController.createBooking
);

router.put("/bookings/:bookingId",
  seller,
  eventController.updateBookingStatus
);

router.get("/bookings/:bookingId", 
  async (req, res) => {
    try {
      const booking = await models.EventBooking.findOne({
        where: { id: req.params.bookingId },
        include: [{
          model: models.Event,
          as: 'event',
          include: [{
            model: models.User,
            as: 'seller',
            attributes: ['name', 'email']
          }]
        }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Réservation non trouvée'
        });
      }

      // Vérifier que l'utilisateur est autorisé à voir cette réservation
      if (booking.userId !== req.user.id && booking.event.sellerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Non autorisé'
        });
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Routes pour les statistiques
router.get("/seller/:sellerId/stats",
  seller,
  eventController.getEventStats
);

export default router;
