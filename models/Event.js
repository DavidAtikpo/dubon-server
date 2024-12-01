import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    continent: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    media: {
      type: [String], // Chemins des fichiers ou URLs
      default: [],
    },
    isLive: {
      type: Boolean,
      default: false, // Indique si l'événement est diffusé en direct
    },
    liveStreamLink: {
      type: String, // URL pour suivre l'événement en direct
      default: "",
    },
    organizer: {
      type: String,
      required: true, // Nom de l'organisateur
    },
    maxAttendees: {
      type: Number, // Capacité maximale d'inscription
      default: 0,
    },
    attendees: {
      type: [String], // Liste des utilisateurs inscrits (emails ou IDs)
      default: [],
    },
    tags: {
      type: [String], // Étiquettes pour le filtrage
      default: [],
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed"], // État de l'événement
      default: "upcoming",
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);

const Event = mongoose.model("Event", eventSchema);

export default Event;

