import User from "../models/User.js";
import Seller from "../models/Seller.js";

// Début de l’essai gratuit et inscription à la formation


//inscription du vendeur


const sellerSubscrition = async (req, res) => {
  try {
    const sellerData = req.body;

    // Validation minimale
    if (!sellerData.personalInfo || !sellerData.compliance) {
      return res.status(400).json({ error: "Les données d'inscription sont incomplètes" });
    }

    // Créer un nouveau document Seller dans la base de données
    const newSeller = new Seller(sellerData);
    await newSeller.save();

    res.status(201).json({ message: "Inscription réussie", sellerId: newSeller._id });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription" });
  }
};




const startFreeTrial = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.isTrialActive = true;
    user.trialEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours d'essai
    user.role = "seller";
    await user.save();

    res.status(200).json({ message: "Essai gratuit activé avec succès. Inscription à la formation obligatoire." });
  } catch (error) {
    console.error("Erreur lors de l'activation de l'essai :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Vérifier si l'essai gratuit est toujours actif
 const checkTrialStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive && user.trialEndDate > Date.now()) {
      return res.status(200).json({ message: "Essai gratuit encore actif.", trialEndDate: user.trialEndDate });
    } else {
      user.isTrialActive = false;
      user.role = "user"; // Révoquer le statut vendeur
      await user.save();
      return res.status(200).json({ message: "Essai gratuit expiré." });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'essai :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Paiement de l’abonnement pour devenir vendeur
 const paySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive) {
      user.subscriptionPaid = true;
      user.isTrialActive = false;
      await user.save();
      res.status(200).json({ message: "Abonnement payé. Vous êtes maintenant un vendeur actif." });
    } else {
      res.status(400).json({ message: "L'essai gratuit est expiré ou n'a pas été activé." });
    }
  } catch (error) {
    console.error("Erreur lors du paiement de l'abonnement :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer tous les vendeurs
const getAllSellers = async (req, res) => {
    try {
      const sellers = await User.find({ role: "seller" });
      res.status(200).json(sellers);
    } catch (error) {
      console.error("Erreur lors de la récupération des vendeurs :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
  
  // Récupérer un vendeur par ID
 const getSellerById = async (req, res) => {
    try {
      const seller = await Seller.findById(req.params.id);
  
      if (!seller) {
        return res.status(404).json({ error: "Vendeur non trouvé." });
      }
  
      res.status(200).json(seller);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
      res.status(500).json({ error: "Erreur serveur lors de la récupération des données." });
    }
  };
  
  
  // Bloquer un vendeur
   const blockSeller = async (req, res) => {
    try {
      const seller = await User.findByIdAndUpdate(
        req.params.id,
        { isBlocked: true },
        { new: true }
      );
      if (!seller || seller.role !== "seller") {
        return res.status(404).json({ message: "Vendeur non trouvé." });
      }
      res.status(200).json({ message: "Vendeur bloqué avec succès." });
    } catch (error) {
      console.error("Erreur lors du blocage du vendeur :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
  
  // Débloquer un vendeur
 const unblockSeller = async (req, res) => {
    try {
      const seller = await User.findByIdAndUpdate(
        req.params.id,
        { isBlocked: false },
        { new: true }
      );
      if (!seller || seller.role !== "seller") {
        return res.status(404).json({ message: "Vendeur non trouvé." });
      }
      res.status(200).json({ message: "Vendeur débloqué avec succès." });
    } catch (error) {
      console.error("Erreur lors du déblocage du vendeur :", error);
      res.status(500).json({ message: "Erreur du serveur." });
    }
  };
export default {sellerSubscrition,startFreeTrial,checkTrialStatus,paySubscription,unblockSeller,blockSeller,getAllSellers,getSellerById}