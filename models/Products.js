import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: false }, // Nom du produit
  sku: { type: String, required: false }, // Référence produit
  vendor: { type: String, required: false }, // Vendeur du produit
  price: { type: Number, required: false }, // Prix actuel
  oldPrice: { type: Number, default: 0 }, // Ancien prix (optionnel)
  discount: { type: Number, default: 0 }, // Remise en pourcentage
  category: { type: String, required: false }, // Catégorie du produit
  availability: { type: String, required: false }, // Disponibilité (e.g., Disponible, Indisponible)
  description: { type: String, required: false }, // Description du produit
  features: { type: [String], default: [] }, // Liste des caractéristiques
  shippingInfo: {
    type: [
      {
        type: { type: String }, // Type de livraison (e.g., Courier, Local Shipping)
        details: { type: String }, // Détails sur la livraison
      },
    ],
    default: [],
  },
  images: { type: [String], required: false }, // Liste des URLs des images
  rating: { type: Number, default: 0 }, // Note moyenne
  reviews: {
    type: [
      {
        user: { type: String }, // Nom de l'utilisateur
        rating: { type: Number }, // Note
        comment: { type: String }, // Commentaire
      },
    ],
    default: [],
  },
  relatedProducts: {
    type: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // Référence à un autre produit
        title: { type: String },
        price: { type: Number },
        image: { type: String },
      },
    ],
    default: [],
  },
});

export default mongoose.model("Product", productSchema);
