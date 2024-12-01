import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: ["cuisine", "management", "informatique", "développement personnel"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  durationInDays: {
    type: Number,
    required: true,
  },
  isOnline: {
    type: Boolean,
    default: false,  // Indique si la formation est en ligne ou en présentiel
  },
  instructor: {
    type: String,
    required: true,  // Nom de l’instructeur
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Users",  // Références aux utilisateurs inscrits
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Training = mongoose.model("Training", trainingSchema);

export default Training;
