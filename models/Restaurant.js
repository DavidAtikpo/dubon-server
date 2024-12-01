import mongoose from "mongoose";

const restaurantItemSchema = new mongoose.Schema({
  name: {
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
    enum: ["entrée", "plat principal", "dessert", "boisson"],
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  ingredients: {
    type: [String],  // Liste des ingrédients
    default: [],
  },
  image: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const RestaurantItem = mongoose.model("RestaurantItem", restaurantItemSchema);

export default RestaurantItem;
