import Event from "../models/Event.js";

// Créer un nouvel événement
const createEvent = async (req, res) => {
  
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      country,
      continent,
      price,
      isLive,
      liveStreamLink,
      organizer,
      maxAttendees,
      tags,
      imageUrl,
    } = req.body;
    console.log('event:',req.body);

    // Valider les champs obligatoires
    if (!title || !description || !date || !location || !country || !continent) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
    }

    // Gestion des images
    let media = [];
    if (req.file) {
      // Si un fichier est uploadé
      const imagePath = `/uploads/${req.file.filename}`; // Assurez-vous que les fichiers sont stockés correctement
      media.push(imagePath);
    } else if (imageUrl) {
      // Si une URL est fournie
      media.push(imageUrl);
    }

    // Création de l'événement
    const newEvent = new Event({
      title,
      description,
      date,
      time,
      location,
      country,
      continent,
      price: parseFloat(price) || 0, // Conversion du prix en nombre
      isLive: isLive || false,
      liveStreamLink,
      organizer,
      maxAttendees: parseInt(maxAttendees) || 0,
      tags: tags ? tags.split(",").map(tag => tag.trim()) : [], // Transforme les tags en tableau
      media,
    });

    const savedEvent = await newEvent.save();

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error("Erreur lors de la création de l'événement :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};


// Récupérer tous les événements
 const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer un événement par ID
 const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("participants", "name email");
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }
    res.status(200).json(event);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour un événement
 const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedEvent) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer un événement
 const deleteEvent = async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }
    res.status(200).json({ message: "Événement supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Ajouter un participant à un événement
 const addParticipant = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }
    if (!event.participants.includes(req.body.userId)) {
      event.participants.push(req.body.userId);
      await event.save();
    }
    res.status(200).json({ message: "Participant ajouté avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'ajout du participant :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};


export default{createEvent,getAllEvents,getEventById,updateEvent,deleteEvent,addParticipant}