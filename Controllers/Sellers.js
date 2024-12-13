import User from "../models/User.js";
import Seller from "../models/Seller.js";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Product from "../models/Product.js";

// Fonction utilitaire pour uploader des fichiers
const uploadFile = async (file, fileType) => {
  try {
    console.log("Début uploadFile pour:", fileType);
    console.log("File reçu:", file);

    if (!file) {
      throw new Error("Fichier manquant");
    }

    // Avec multer, le fichier est déjà déplacé
    // Nous n'avons qu'à retourner le chemin
    return file.path.replace(/\\/g, '/'); // Convertir les backslashes en forward slashes pour les URLs

  } catch (error) {
    console.error("Erreur détaillée lors de l'upload :", error);
    throw new Error(`Échec de l'upload du fichier: ${error.message}`);
  }
};

// Toutes les fonctions exportées
export const registerSeller = async (req, res) => {
  try {
    console.log("Début de registerSeller");
    console.log("Files reçus:", req.files);
    console.log("Body reçu:", req.body);
    console.log("User ID:", req.user._id);

    const formData = JSON.parse(req.body.data);
    
    // Nettoyer les données des produits
    if (formData.businessInfo?.products) {
      formData.businessInfo.products = formData.businessInfo.products.map(product => ({
        ...product,
        images: []
      }));
    }

    // Gérer les uploads de fichiers
    const fileData = {
      documents: {
        idCard: req.files?.idCard?.[0]?.path,
        proofOfAddress: req.files?.proofOfAddress?.[0]?.path,
        taxCertificate: req.files?.taxCertificate?.[0]?.path,
        photos: req.files?.photos?.map(photo => photo.path) || []
      },
      contract: {
        signed: true,
        signedDocument: req.files?.signedDocument?.[0]?.path
      },
      videoVerification: {
        completed: true,
        recordingUrl: req.files?.verificationVideo?.[0]?.path
      }
    };

    const sellerData = {
      ...formData,
      ...fileData,
      userId: req.user._id,
      status: 'pending',
      updatedAt: new Date()
    };

    // Vérifier si le vendeur existe déjà
    const existingSeller = await Seller.findOne({ userId: req.user._id });

    let seller;
    if (existingSeller) {
      // Mettre à jour le vendeur existant
      seller = await Seller.findOneAndUpdate(
        { userId: req.user._id },
        sellerData,
        { new: true }
      );
      console.log("Vendeur mis à jour:", seller);
    } else {
      // Créer un nouveau vendeur
      sellerData.createdAt = new Date();
      seller = new Seller(sellerData);
      await seller.save();
      console.log("Nouveau vendeur créé:", seller);
    }

    res.status(201).json({
      success: true,
      message: existingSeller ? "Données mises à jour avec succès" : "Inscription réussie, en attente de validation",
      seller: seller
    });

  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription/mise à jour",
      error: error.message
    });
  }
};

export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user._id;
    const seller = await Seller.findOne({ userId });

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: "Vendeur non trouvé" 
      });
    }

    // Mettre à jour le statut du vendeur
    seller.subscription = {
      plan: 'trial',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      status: 'active'
    };

    await seller.save();

    // Mettre à jour le rôle de l'utilisateur
    await User.findByIdAndUpdate(userId, {
      $set: { role: 'seller' }
    });

    res.status(200).json({
      success: true,
      message: "Essai gratuit activé avec succès",
      data: seller
    });
  } catch (error) {
    console.error("Erreur lors de l'activation de l'essai:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'activation de l'essai"
    });
  }
};

export const checkTrialStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive && user.trialEndDate > Date.now()) {
      return res
        .status(200)
        .json({ message: "Essai gratuit actif.", trialEndDate: user.trialEndDate });
    } else {
      user.isTrialActive = false;
      user.role = "user"; // Rétablir le rôle utilisateur
      await user.save();
      return res.status(200).json({ message: "Essai gratuit expiré." });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'essai :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const paySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive) {
      user.subscriptionPaid = true;
      user.isTrialActive = false;
      await user.save();
      res.status(200).json({ message: "Abonnement payé avec succès." });
    } else {
      res.status(400).json({ message: "Essai gratuit expiré ou non activé." });
    }
  } catch (error) {
    console.error("Erreur lors du paiement :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.status(200).json(sellers);
  } catch (error) {
    console.error("Erreur lors de la récupération des vendeurs :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json(seller);
  } catch (error) {
    console.error("Erreur lors de la récupération :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const blockSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json({ message: "Vendeur bloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du blocage :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const unblockSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json({ message: "Vendeur débloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du déblocage :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const checkValidationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Checking status for userId:", userId);

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    console.log("User found:", user);

    // Rechercher la demande de vendeur
    const seller = await Seller.findOne({ userId })
      .select('status validation createdAt userId')
      .lean();

    console.log("Seller found:", seller);

    // Vérifier toutes les demandes de vendeur (pour le débogage)
    const allSellers = await Seller.find({}).lean();
    console.log("All sellers:", allSellers);

    if (!seller) {
      return res.status(200).json({
        success: true,
        status: 'not_found',
        message: 'Aucune demande trouvée'
      });
    }

    // Vérifier les deux champs de statut
    const isApproved = 
      seller.status === 'approved' && 
      seller.validation?.status === 'approved';

    res.status(200).json({
      success: true,
      status: isApproved ? 'approved' : (seller.status || 'pending'),
      sellerId: seller._id,
      createdAt: seller.createdAt,
      message: seller.validation?.message,
      approvedAt: seller.validation?.approvedAt
    });
  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut',
      error: error.message
    });
  }
};

export const getAllSellerRequests = async (req, res) => {
  try {
    const sellers = await Seller.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes de vendeur"
    });
  }
};

export const getSellerData = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await Seller.findById(sellerId)
      .populate('userId', 'name email')
      .lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error fetching seller data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller data'
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const seller = await Seller.findOne({ userId: sellerId });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    // Gérer les images uploadées
    const images = [];
    if (req.files?.images) {
      images.push(...req.files.images.map(file => file.path));
    }
    
    // Ajouter les URLs d'images si fournies
    if (req.body.images) {
      const urlImages = JSON.parse(req.body.images);
      images.push(...urlImages);
    }

    const productData = {
      sellerId: seller._id,
      name: req.body.name,
      description: req.body.description,
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      images: images,
      category: req.body.category || 'uncategorized',
      createdAt: new Date()
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });

  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit",
      error: error.message
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const seller = await Seller.findOne({ userId: sellerId });
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    const products = await Product.find({ sellerId: seller._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits"
    });
  }
};
