import { models } from '../models/index.js';
import { sendEmail } from '../utils/emailUtils.js';
import fs from 'fs';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

// Validation et vérification
export const checkValidationStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non connecté'
      });
    }

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

    // Vérifier si une demande existe déjà
    const existingRequest = await models.SellerRequest.findOne({
      where: { 
        userId: req.user.id,
        status: ['pending', 'approved']
      }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: existingRequest.status === 'pending' 
          ? 'Une demande est déjà en cours de traitement'
          : 'Vous êtes déjà vendeur'
      });
    }

    // Vérifier si les fichiers sont présents
    if (!req.files) {
      console.error("Aucun fichier reçu");
      return res.status(400).json({
        success: false,
        message: "Aucun fichier n'a été fourni"
      });
    }

    let formData = JSON.parse(req.body.data);

    // Préparer les chemins des fichiers
    const documents = {};
    const addDocument = (fieldName, file) => {
      if (file) {
        documents[`${fieldName}Url`] = file.path;
      }
    };

    // Traiter chaque type de document
    addDocument('idCard', req.files?.idCard?.[0]);
    addDocument('proofOfAddress', req.files?.proofOfAddress?.[0]);
    addDocument('taxCertificate', req.files?.taxCertificate?.[0]);
    
    if (req.files?.photos) {
      documents.photoUrls = req.files.photos.map(photo => photo.path);
    } else {
      documents.photoUrls = [];
    }
    
    addDocument('shopImage', req.files?.shopImage?.[0]);

    if (formData.type === 'company') {
      addDocument('rccm', req.files?.rccm?.[0]);
      addDocument('companyStatutes', req.files?.companyStatutes?.[0]);
    }

    addDocument('signedDocument', req.files?.signedDocument?.[0]);
    addDocument('verificationVideo', req.files?.verificationVideo?.[0]);

    // Créer la demande de vendeur
    const sellerRequest = await models.SellerRequest.create({
      userId: req.user.id,
      type: formData.type || 'individual',
      status: 'pending',
      personalInfo: {
        ...formData.personalInfo,
        email: formData.personalInfo?.email?.toLowerCase() || req.user.email
      },
      businessInfo: {
        ...formData.businessInfo,
        shopName: formData.businessInfo?.shopName?.trim()
      },
      documents: documents,
      compliance: formData.compliance || {
        termsAccepted: false,
        qualityStandardsAccepted: false,
        antiCounterfeitingAccepted: false
      },
      contract: {
        signed: Boolean(documents.signedDocumentUrl),
        signedAt: documents.signedDocumentUrl ? new Date() : null,
        signedDocumentUrl: documents.signedDocumentUrl
      },
      videoVerification: {
        completed: Boolean(documents.verificationVideoUrl),
        verifiedAt: documents.verificationVideoUrl ? new Date() : null,
        verificationVideoUrl: documents.verificationVideoUrl
      }
    });

    // Envoyer un email de confirmation
    try {
      await sendEmail({
        to: formData.personalInfo?.email || req.user.email,
        subject: 'Demande vendeur reçue',
        template: 'seller-request-received',
        context: {
          name: formData.type === 'individual' 
            ? formData.personalInfo?.fullName 
            : formData.personalInfo?.companyName,
          requestId: sellerRequest.id
        }
      });
    } catch (emailError) {
      console.error('❌ Erreur envoi email de confirmation:', emailError);
    }
    
    res.status(201).json({ 
      success: true, 
      message: "Demande d'inscription vendeur créée avec succès",
      data: {
        id: sellerRequest.id,
        status: sellerRequest.status,
        type: sellerRequest.type,
        createdAt: sellerRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Erreur complète inscription vendeur:', error);
    res.status(400).json({ 
      success: false, 
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  }
};

// Routes publiques
export const getPublicSellers = async (req, res) => {
  try {
    const sellers = await models.User.findAll({
      where: { 
        role: 'seller',
        status: 'active'
      },
      include: [{
        model: models.SellerProfile,
        where: { status: 'active' },
        required: true
      }],
      attributes: ['id', 'name', 'avatar']
    });

    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('Erreur getPublicSellers:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des vendeurs"
    });
  }
};

export const getSellerCategories = async (req, res) => {
  try {
    const categories = await models.Category.findAll({
      where: { type: 'seller' },
      attributes: ['id', 'name', 'description']
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur getSellerCategories:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des catégories"
    });
  }
};

// Routes admin
export const getAllSellerRequests = async (req, res) => {
  try {
    const requests = await models.SellerRequest.findAll({
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Erreur getAllSellerRequests:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes"
    });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await models.User.findAll({
      where: { role: 'seller' },
      include: [{
        model: models.SellerProfile,
        required: true
      }]
    });

    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('Erreur getAllSellers:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des vendeurs"
    });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await models.User.findOne({
      where: { 
        id: req.params.id,
        role: 'seller'
      },
      include: [{
        model: models.SellerProfile,
        required: true
      }]
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    res.json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Erreur getSellerById:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du vendeur"
    });
  }
};

// Gestion du statut
export const blockSeller = async (req, res) => {
  try {
    const seller = await models.User.findOne({
      where: { 
        id: req.params.id,
        role: 'seller'
      }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    await seller.update({ status: 'blocked' });

    res.json({
      success: true,
      message: "Vendeur bloqué avec succès"
    });
  } catch (error) {
    console.error('Erreur blockSeller:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du blocage du vendeur"
    });
  }
};

export const unblockSeller = async (req, res) => {
  try {
    const seller = await models.User.findOne({
      where: { 
        id: req.params.id,
        role: 'seller'
      }
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    await seller.update({ status: 'active' });

    res.json({
      success: true,
      message: "Vendeur débloqué avec succès"
    });
  } catch (error) {
    console.error('Erreur unblockSeller:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du déblocage du vendeur"
    });
  }
};

// Vérifier le statut de l'abonnement
export const checkSubscriptionStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non connecté'
      });
    }

    const subscription = await models.Subscription.findOne({
      where: { 
        userId: req.user.id,
        status: 'active'
      },
      include: [{
        model: models.Plan,
        as: 'plan'
      }]
    });

    if (!subscription) {
      return res.json({
        success: true,
        status: 'inactive'
      });
    }

    res.json({
      success: true,
      status: subscription.status,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Autres fonctions nécessaires
export const getProfile = async (req, res) => {
  try {
    const profile = await models.SellerProfile.findOne({
      where: { userId: req.user.id },
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email', 'avatar']
      }]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil"
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { businessInfo, settings } = req.body;
    const logoUrl = req.file ? req.file.path : undefined;

    const profile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    const updatedProfile = await profile.update({
      businessInfo: {
        ...profile.businessInfo,
        ...businessInfo,
        ...(logoUrl && { logoUrl })
      },
      settings: {
        ...profile.settings,
        ...settings
      }
    });

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: updatedProfile
    });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil"
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { sellerId: req.seller.id };
    if (status) whereClause.status = status;

    const products = await models.Product.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products: products.rows,
        total: products.count,
        pages: Math.ceil(products.count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getSellerProducts:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits"
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const images = req.files;

    const product = await models.Product.findOne({
      where: { 
        id,
        sellerId: req.seller.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    if (images?.length) {
      updateData.images = images.map(img => img.path);
    }

    const updatedProduct = await product.update(updateData);

    res.json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: updatedProduct
    });
  } catch (error) {
    console.error('Erreur updateProduct:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du produit"
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await models.Product.findOne({
      where: { 
        id,
        sellerId: req.seller.id
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: "Produit supprimé avec succès"
    });
  } catch (error) {
    console.error('Erreur deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du produit"
    });
  }
};

// Statistiques et analyses
export const getStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await models.Order.findAll({
      where: {
        sellerId: req.seller.id,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('count', sequelize.col('id')), 'count'],
        [sequelize.fn('sum', sequelize.col('total')), 'total']
      ],
      group: [sequelize.fn('date', sequelize.col('createdAt'))]
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [salesTrend, topProducts, customerStats] = await Promise.all([
      models.Order.findAll({
        where: {
          sellerId: req.seller.id,
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: [
          [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('count', sequelize.col('id')), 'orders'],
          [sequelize.fn('sum', sequelize.col('total')), 'revenue']
        ],
        group: [sequelize.fn('date', sequelize.col('createdAt'))]
      }),
      models.Product.findAll({
        where: { sellerId: req.seller.id },
        order: [['sales', 'DESC']],
        limit: 5
      }),
      models.Order.findAll({
        where: { sellerId: req.seller.id },
        attributes: [
          'customerId',
          [sequelize.fn('count', sequelize.col('id')), 'orderCount'],
          [sequelize.fn('sum', sequelize.col('total')), 'totalSpent']
        ],
        group: ['customerId'],
        order: [[sequelize.fn('count', sequelize.col('id')), 'DESC']],
        limit: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        salesTrend,
        topProducts,
        customerStats
      }
    });
  } catch (error) {
    console.error('Erreur getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des analyses"
    });
  }
};

// Gestion financière
export const getEarnings = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const today = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      default:
        startDate = new Date(today.setMonth(today.getMonth() - 1));
    }

    const earnings = await models.Order.findAll({
      where: {
        sellerId: req.seller.id,
        status: 'completed',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('sum', sequelize.col('total')), 'total'],
        [sequelize.fn('sum', sequelize.col('commission')), 'commission']
      ],
      group: [sequelize.fn('date', sequelize.col('createdAt'))]
    });

    const totals = await models.Order.findOne({
      where: {
        sellerId: req.seller.id,
        status: 'completed',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('sum', sequelize.col('total')), 'totalEarnings'],
        [sequelize.fn('sum', sequelize.col('commission')), 'totalCommission']
      ]
    });

    res.json({
      success: true,
      data: {
        earnings,
        summary: {
          totalEarnings: parseFloat(totals.totalEarnings) || 0,
          totalCommission: parseFloat(totals.totalCommission) || 0,
          netEarnings: (parseFloat(totals.totalEarnings) || 0) - (parseFloat(totals.totalCommission) || 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, bankInfo } = req.body;

    // Vérifier le solde disponible
    const availableBalance = await models.SellerBalance.findOne({
      where: { sellerId: req.seller.id }
    });

    if (!availableBalance || availableBalance.amount < amount) {
      return res.status(400).json({
        success: false,
        message: "Solde insuffisant pour effectuer le retrait"
      });
    }

    // Créer la demande de retrait
    const withdrawal = await models.Withdrawal.create({
      sellerId: req.seller.id,
      amount,
      bankInfo,
      status: 'pending'
    });

    // Mettre à jour le solde
    await availableBalance.update({
      amount: availableBalance.amount - amount,
      pendingWithdrawals: availableBalance.pendingWithdrawals + amount
    });

    res.json({
      success: true,
      message: "Demande de retrait créée avec succès",
      data: withdrawal
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { sellerId: req.seller.id };
    if (type) whereClause.type = type;

    const transactions = await models.Transaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: models.Order,
        attributes: ['orderNumber']
      }]
    });

    res.json({
      success: true,
      data: {
        transactions: transactions.rows,
        total: transactions.count,
        pages: Math.ceil(transactions.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des promotions
export const createPromotion = async (req, res) => {
  try {
    const { title, description, discountType, discountValue, startDate, endDate, conditions } = req.body;

    const promotion = await models.Promotion.create({
      sellerId: req.seller.id,
      title,
      description,
      discountType,
      discountValue,
      startDate,
      endDate,
      conditions,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: "Promotion créée avec succès",
      data: promotion
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSellerPromotions = async (req, res) => {
  try {
    const { status } = req.query;
    const whereClause = { sellerId: req.seller.id };
    if (status) whereClause.status = status;

    const promotions = await models.Promotion.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: promotions
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const promotion = await models.Promotion.findOne({
      where: { id, sellerId: req.seller.id }
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion non trouvée"
      });
    }

    await promotion.update(updateData);

    res.json({
      success: true,
      message: "Promotion mise à jour avec succès",
      data: promotion
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await models.Promotion.findOne({
      where: { id, sellerId: req.seller.id }
    });

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: "Promotion non trouvée"
      });
    }

    await promotion.destroy();

    res.json({
      success: true,
      message: "Promotion supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Vérification du vendeur
export const verifySeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await models.SellerProfile.findByPk(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    await seller.update({
      verificationStatus: 'verified',
      verifiedAt: new Date()
    });

    // Envoyer un email de confirmation
    await sendEmail({
      to: seller.user.email,
      subject: 'Compte vendeur vérifié',
      template: 'seller-verified',
      context: {
        name: seller.businessInfo.name
      }
    });

    res.json({
      success: true,
      message: "Vendeur vérifié avec succès",
      data: seller
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const seller = await models.SellerProfile.findByPk(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    await seller.update({
      status,
      statusReason: reason,
      statusUpdatedAt: new Date()
    });

    res.json({
      success: true,
      message: "Statut du vendeur mis à jour avec succès",
      data: seller
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await models.SellerProfile.findByPk(id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    // Supprimer le profil vendeur et mettre à jour le rôle utilisateur
    await Promise.all([
      seller.destroy(),
      models.User.update(
        { role: 'user' },
        { where: { id: seller.userId } }
      )
    ]);

    res.json({
      success: true,
      message: "Vendeur supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Fonctions manquantes pour les routes du tableau de bord
export const getDashboard = async (req, res) => {
  try {
    const [orders, products, earnings] = await Promise.all([
      models.Order.count({ where: { sellerId: req.seller.id } }),
      models.Product.count({ where: { sellerId: req.seller.id } }),
      models.Order.sum('total', { 
        where: { 
          sellerId: req.seller.id,
          status: 'completed'
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        products,
        earnings: earnings || 0
      }
    });
  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données du tableau de bord"
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { sellerId: req.seller.id };
    if (status) whereClause.status = status;

    const orders = await models.Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: models.User,
        as: 'customer',
        attributes: ['id', 'name', 'email']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        pages: Math.ceil(orders.count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getSellerOrders:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes"
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await models.Order.findOne({
      where: { 
        id,
        sellerId: req.seller.id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    await order.update({ status });

    res.json({
      success: true,
      message: "Statut de la commande mis à jour avec succès",
      data: order
    });
  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de la commande"
    });
  }
};

