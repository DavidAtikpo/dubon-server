import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    images: [String], // Stocke les URLs des images
  });
  
  const sellerSchema = new mongoose.Schema({
    type: { type: String, enum: ["individual", "company"], required: true },
    personalInfo: {
      fullName: { type: String, required: function () { return this.type === "individual"; } },
      companyName: { type: String, required: function () { return this.type === "company"; } },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      idNumber: String,
      taxNumber: { type: String, required: true },
      legalRepName: String,
      rccmNumber: String,
    },
    documents: {
      idCard: String, // URL du fichier
      proofOfAddress: String, // URL du fichier
      photos: [String], // URLs des fichiers
      taxCertificate: String, // URL du fichier
      rccm: String, // URL du fichier
      companyStatutes: String, // URL du fichier
    },
    contract: {
      signed: { type: Boolean, default: false },
      signedDocument: String, // URL du fichier
    },
    videoVerification: {
      completed: { type: Boolean, default: false },
      recordingUrl: String, // URL de la vidéo
    },
    businessInfo: {
      category: { type: String, required: true },
      description: { type: String, required: true },
      products: [productSchema], // Liste des produits
      bankDetails: {
        type: { type: String, enum: ["bank", "mobile"], required: true },
        accountNumber: { type: String, required: true },
        bankName: String,
      },
      returnPolicy: { type: String, required: true },
    },
    compliance: {
      termsAccepted: { type: Boolean, required: true },
      qualityStandardsAccepted: { type: Boolean, required: true },
      antiCounterfeitingAccepted: { type: Boolean, required: true },
    },
  });
  
  const Seller = mongoose.model("Seller", sellerSchema);
  
  export default Seller;
  