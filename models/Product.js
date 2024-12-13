import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: [String],
  category: {
    type: String,
    default: 'uncategorized'
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Créer le modèle s'il n'existe pas déjà
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product; 