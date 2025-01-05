import { models } from '../models/index.js';
import { sendEmail } from '../utils/emailUtils.js';

// Validation et vérification
export const checkValidationStatus = async (req, res) => {
  try {
    const request = await models.SellerRequest.findOne({
      where: { userId: req.user.id },
      attributes: ['status', 'type', 'rejectionReason', 'verifiedAt']
    });

    if (!request) {
      return res.json({ 
        success: true, 
        status: 'not_started' 
      });
    }

    res.json({ 
      success: true, 
      status: request.status,
      data: request 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Gestion des vendeurs
export const registerSeller = async (req, res) => {
  try {
    console.log("Début du traitement de la requête vendeur");
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Non autorisé - Utilisateur non trouvé' 
      });
    }

    console.log("Fichiers reçus:", req.files);
    console.log("Corps de la requête:", req.body);

    // Parser les données JSON
    const formData = JSON.parse(req.body.data);
    console.log("Données parsées:", formData);

    // Préparer les chemins des fichiers
    const documents = {
      idCardUrl: req.files.idCard?.[0]?.path,
      proofOfAddressUrl: req.files.proofOfAddress?.[0]?.path,
      taxCertificateUrl: req.files.taxCertificate?.[0]?.path,
      photoUrls: req.files.photos?.map(photo => photo.path) || [],
      signedDocumentUrl: req.files.signedDocument?.[0]?.path,
      verificationVideoUrl: req.files.verificationVideo?.[0]?.path,
      shopImageUrl: req.files.shopImage?.[0]?.path
    };

    console.log("Documents préparés:", documents);

    try {
      // Créer la demande de vendeur
      const sellerRequest = await models.SellerRequest.create({
        userId: req.user.id,
        type: formData.type,
        businessType: formData.businessType || 'Retail',
        status: 'pending',
        personalInfo: formData.personalInfo,
        businessInfo: formData.businessInfo,
        documents: documents,
        compliance: formData.compliance,
        contract: formData.contract || { signed: false, signedAt: null },
        videoVerification: formData.videoVerification || { completed: false, verifiedAt: null }
      });

      console.log("Demande créée avec succès:", sellerRequest.id);
      
      res.status(201).json({ 
        success: true, 
        message: "Demande d'inscription vendeur créée avec succès",
        data: sellerRequest 
      });
    } catch (dbError) {
      console.error("Erreur lors de la création en base:", dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Erreur complète inscription vendeur:', error);
    res.status(400).json({ 
      success: false, 
      message: "Erreur lors de l'inscription",
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

// Vérifier le statut de l'abonnement
export const checkSubscriptionStatus = async (req, res) => {
  try {
    const seller = await models.User.findByPk(req.user.id, {
      include: [{
        model: models.Subscription,
        as: 'subscription'
      }]
    });

    if (!seller.subscription || !seller.subscription.isActive) {
      return res.json({
        success: true,
        status: 'inactive'
      });
    }

    res.json({
      success: true,
      status: 'active',
      data: seller.subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Initier un paiement FedaPay
export const initiateSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    
    // Logique pour créer une transaction FedaPay
    const fedaPayTransaction = await createFedaPayTransaction({
      amount: planId === 'monthly' ? 10000 : 100000,
      description: `Abonnement ${planId === 'monthly' ? 'mensuel' : 'annuel'} vendeur`,
      callback_url: `${process.env.BASE_URL}/api/seller/subscription/callback`
    });

    res.json({
      success: true,
      paymentUrl: fedaPayTransaction.paymentUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
