import { models } from '../models/index.js';
import { sendEmail } from '../utils/emailUtils.js';

// Validation et vérification
export const checkValidationStatus = async (req, res) => {
  try {
    const request = await models.SellerRequest.findOne({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des vendeurs
export const registerSeller = async (req, res) => {
  try {
    // Vérifier si l'utilisateur existe et est autorisé
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Utilisateur non trouvé' 
      });
    }

    const sellerRequest = await models.SellerRequest.create({
      ...req.body,
      userId: req.user.id,
      documents: req.files,
      status: 'pending' // Ajouter un statut initial
    });

    res.status(201).json({ success: true, data: sellerRequest });
  } catch (error) {
    console.error('Erreur inscription vendeur:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.errors?.map(e => e.message)
    });
  }
};

export const getSellerData = async (req, res) => {
  try {
    const seller = await models.SellerProfile.findOne({
      where: { id: req.params.id },
      include: ['settings', 'stats']
    });
    res.json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des produits
export const createProduct = async (req, res) => {
  try {
    const product = await models.Product.create({
      ...req.body,
      sellerId: req.user.sellerId,
      images: req.files?.images?.map(f => f.path)
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const products = await models.Product.findAll({
      where: { sellerId: req.user.sellerId }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Routes admin
export const getAllSellerRequests = async (req, res) => {
  try {
    const requests = await models.SellerRequest.findAll({
      include: ['user']
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await models.SellerProfile.findAll({
      include: ['user', 'settings']
    });
    res.json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await models.SellerProfile.findByPk(req.params.id, {
      include: ['user', 'settings', 'stats']
    });
    res.json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion du statut
export const blockSeller = async (req, res) => {
  try {
    await models.SellerProfile.update(
      { status: 'blocked' },
      { where: { id: req.params.id } }
    );
    res.json({ success: true, message: 'Vendeur bloqué' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const unblockSeller = async (req, res) => {
  try {
    await models.SellerProfile.update(
      { status: 'active' },
      { where: { id: req.params.id } }
    );
    res.json({ success: true, message: 'Vendeur débloqué' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des essais et abonnements
export const startFreeTrial = async (req, res) => {
  try {
    const seller = await models.SellerProfile.findByPk(req.params.id);
    await seller.update({
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    res.json({ success: true, message: 'Période d\'essai démarrée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const checkTrialStatus = async (req, res) => {
  try {
    const seller = await models.SellerProfile.findByPk(req.params.id);
    res.json({ success: true, data: seller.trialStatus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const paySubscription = async (req, res) => {
  try {
    // Logique de paiement à implémenter
    res.json({ success: true, message: 'Paiement traité' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Autres fonctions nécessaires
export const getProfile = async (req, res) => {
  // Implémentation
};

export const updateProfile = async (req, res) => {
  // Implémentation
};

export const addProduct = async (req, res) => {
  // Implémentation
};

export const updateProduct = async (req, res) => {
  // Implémentation
};

export const deleteProduct = async (req, res) => {
  // Implémentation
};

export const getSellerOrders = async (req, res) => {
  // Implémentation
};

export const updateOrderStatus = async (req, res) => {
  // Implémentation
};

export const getDashboard = async (req, res) => {
  // Implémentation
};

export const getStats = async (req, res) => {
  // Implémentation
};

export const getAnalytics = async (req, res) => {
  // Implémentation
};

export const getEarnings = async (req, res) => {
  // Implémentation
};

export const requestWithdrawal = async (req, res) => {
  // Implémentation
};

export const getTransactions = async (req, res) => {
  // Implémentation
};

export const createPromotion = async (req, res) => {
  // Implémentation
};

export const getSellerPromotions = async (req, res) => {
  // Implémentation
};

export const updatePromotion = async (req, res) => {
  // Implémentation
};

export const deletePromotion = async (req, res) => {
  // Implémentation
};

export const verifySeller = async (req, res) => {
  // Implémentation
};

export const updateSellerStatus = async (req, res) => {
  // Implémentation
};

export const deleteSeller = async (req, res) => {
  // Implémentation
};

export const getPublicSellers = async (req, res) => {
  // Implémentation
};

export const getSellerCategories = async (req, res) => {
  // Implémentation
};
