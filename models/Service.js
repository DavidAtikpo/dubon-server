import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,  // Supprime les espaces superflus en début et fin
  },
  description: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,  // Empêche les prix négatifs
  },
  category: {
    type: String,
    enum: ["assistance", "installation", "nettoyage", "formation", "autre"],
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,  // Indique si le service est disponible
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",  // L'utilisateur qui fournit ce service
    required: true,
  },
  durationInHours: {
    type: Number,
    required: true,  // Durée du service en heures
  },
  location: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    postal_code: { type: String, required: true },
    country: { type: String, required: true },
  },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
