import { models } from '../models/index.js';
import { sendEmail } from '../utils/emailUtils.js';
import fs from 'fs';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

// Fonction utilitaire pour ajouter une entrée dans l'historique
const addToSellerHistory = async ({
  sellerId,
  type,
  action,
  description,
  details = {},
  status = 'success',
  ip = null,
  userAgent = null
}) => {
  try {
    await models.SellerHistory.create({
      sellerId,
      type,
      action,
      description,
      details,
      status,
      ip,
      userAgent
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout à l\'historique:', error);
  }
};

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
    console.log('Fetching seller categories...');
    const categories = await models.Category.findAll({
      attributes: ['id', 'name', 'description'],
      where: {
        status: 'active'
      }
    });

    console.log(`Found ${categories.length} categories`);
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getSellerCategories:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des catégories",
      error: error.message
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

    // Ajouter l'action à l'historique
    await addToSellerHistory({
      sellerId: profile.id,
      type: 'profile',
      action: 'update',
      description: 'Mise à jour du profil vendeur',
      details: { businessInfo, settings },
      ip: req.ip,
      userAgent: req.headers['user-agent']
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
    const { page = 1, limit = 50, status } = req.query;
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

    // Ajouter l'action à l'historique
    await addToSellerHistory({
      sellerId: req.seller.id,
      type: 'product',
      action: 'update',
      description: `Mise à jour du produit: ${product.name}`,
      details: { productId: id, updates: updateData },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

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

    // Ajouter l'action à l'historique
    await addToSellerHistory({
      sellerId: req.seller.id,
      type: 'product',
      action: 'delete',
      description: `Suppression du produit: ${product.name}`,
      details: { 
        productId: id,
        productName: product.name,
        productPrice: product.price
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

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
    // Get total orders count
    const totalOrders = await models.Order.count({
      where: { sellerId: req.seller.id }
    });

    // Get pending orders count
    const pendingOrders = await models.Order.count({
      where: { 
        sellerId: req.seller.id,
        status: 'pending'
      }
    });

    // Get delivered orders count and total amount
    const completedOrders = await models.Order.count({
      where: { 
        sellerId: req.seller.id,
        status: 'delivered'
      }
    });

    // Get total amount from delivered orders
    const completedOrdersWithTotal = await models.Order.findAll({
      where: { 
        sellerId: req.seller.id,
        status: 'delivered'
      },
      attributes: ['total']
    });

    const totalAmount = completedOrdersWithTotal.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalAmount
    };

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get sales data for the period
    const orders = await models.Order.findAll({
      where: {
        sellerId: req.seller.id,
        status: 'delivered',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Process orders to get daily stats
    const dailyStats = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += Number(order.total) || 0;
      return acc;
    }, {});

    // Get top performing products
    const products = await models.Product.findAll({
      where: { 
        sellerId: req.seller.id 
      },
      order: [['salesCount', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'salesCount', 'price']
    });

    // Get customer metrics
    const uniqueCustomers = await models.Order.count({
      where: {
        sellerId: req.seller.id,
        status: 'delivered',
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      },
      distinct: true,
      col: 'userId'
    });

    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const analyticsData = {
      salesData: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        orders: stats.orders,
        revenue: stats.revenue
      })),
      productPerformance: products.map(product => ({
        id: product.id,
        name: product.name,
        totalSold: product.salesCount,
        totalRevenue: product.price * product.salesCount
      })),
      customerMetrics: {
        uniqueCustomers,
        averageOrderValue
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Erreur getAnalytics:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des analytics"
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
    console.log('🚀 Starting withdrawal request');
    console.log('👤 User:', req.user?.id);
    console.log('💰 Request body:', req.body);

    if (!req.user || !req.user.id) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    const { amount, bankInfo } = req.body;

    if (!amount || amount <= 0) {
      console.log('❌ Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: "Le montant du retrait doit être supérieur à 0"
      });
    }

    // Récupérer le profil vendeur
    console.log('🔍 Fetching seller profile');
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!sellerProfile) {
      console.log('❌ No seller profile found');
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Vérifier le solde disponible
    console.log('💳 Checking available balance');
    const completedOrders = await models.Order.findAll({
      where: {
        sellerId: sellerProfile.id,
        status: 'delivered',
        paymentStatus: 'completed'
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('total')), 'totalEarnings']]
    });

    // Récupérer les retraits déjà effectués
    const withdrawals = await models.Withdrawal.findAll({
      where: {
        sellerId: sellerProfile.id,
        status: ['completed', 'pending']
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalWithdrawn']]
    });

    const totalEarnings = completedOrders[0].getDataValue('totalEarnings') || 0;
    const totalWithdrawn = withdrawals[0].getDataValue('totalWithdrawn') || 0;
    const availableBalance = totalEarnings - totalWithdrawn;

    if (availableBalance < amount) {
      // Ajouter l'action échouée à l'historique
      await addToSellerHistory({
        sellerId: sellerProfile.id,
        type: 'withdrawal',
        action: 'request',
        description: `Tentative de retrait de ${amount} XOF échouée - Solde insuffisant`,
        details: { amount, availableBalance },
        status: 'failed',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(400).json({
        success: false,
        message: "Solde insuffisant pour effectuer le retrait"
      });
    }

    const withdrawal = await models.Withdrawal.create({
      id: uuidv4(),
      sellerId: sellerProfile.id,
      amount,
      currency: 'XOF',
      paymentMethod: 'bank_transfer',
      bankInfo: bankInfo || {},
      status: 'pending',
      netAmount: amount,
      balanceBefore: availableBalance,
      balanceAfter: availableBalance - amount
    });

    // Ajouter l'action réussie à l'historique
    await addToSellerHistory({
      sellerId: sellerProfile.id,
      type: 'withdrawal',
      action: 'request',
      description: `Demande de retrait de ${amount} XOF`,
      details: { 
        withdrawalId: withdrawal.id,
        amount,
        balanceBefore: availableBalance,
        balanceAfter: availableBalance - amount
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(201).json({
      success: true,
      message: "Demande de retrait créée avec succès",
      data: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error in requestWithdrawal:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la demande de retrait",
      error: error.message
    });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;

    // Récupérer les paiements et les retraits
    const [payments, withdrawals] = await Promise.all([
      models.Payment.findAll({
        where: { sellerId: req.seller.id },
        order: [['createdAt', 'DESC']],
        include: [{
          model: models.Order,
          attributes: ['orderNumber']
        }]
      }),
      models.Withdrawal.findAll({
        where: { sellerId: req.seller.id },
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Combiner et formater les transactions
    const allTransactions = [
      ...payments.map(p => ({
        id: p.id,
        type: 'payment',
        amount: p.amount,
        status: p.status,
        orderNumber: p.Order?.orderNumber,
        createdAt: p.createdAt
      })),
      ...withdrawals.map(w => ({
        id: w.id,
        type: 'withdrawal',
        amount: w.amount,
        status: w.status,
        createdAt: w.createdAt
      }))
    ].sort((a, b) => b.createdAt - a.createdAt);

    // Filtrer par type si spécifié
    const filteredTransactions = type 
      ? allTransactions.filter(t => t.type === type)
      : allTransactions;

    // Paginer les résultats
    const paginatedTransactions = filteredTransactions.slice(offset, offset + limit);
    const total = filteredTransactions.length;

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getTransactions:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des transactions",
      error: error.message 
    });
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

    // Ajouter l'action à l'historique
    await addToSellerHistory({
      sellerId: req.seller.id,
      type: 'promotion',
      action: 'create',
      description: `Création d'une nouvelle promotion: ${title}`,
      details: { 
        promotionId: promotion.id,
        discountType,
        discountValue,
        startDate,
        endDate
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
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
    if (status && status !== 'all') whereClause.status = status;

    const orders = await models.Order.findAndCountAll({
      where: whereClause,
      include: [{
        model: models.User,
        as: 'user',
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

    const previousStatus = order.status;
    await order.update({ status });

    // Ajouter l'action à l'historique
    await addToSellerHistory({
      sellerId: req.seller.id,
      type: 'order',
      action: 'status_update',
      description: `Mise à jour du statut de la commande ${order.orderNumber} de ${previousStatus} à ${status}`,
      details: { 
        orderId: id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus: status
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

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

export const getSellerProduct = async (req, res) => {
  try {
    console.log('🔍 Fetching product with ID:', req.params.id);
    
    // Vérifier si le produit existe et appartient au vendeur
    const product = await models.Product.findOne({
      where: {
        id: req.params.id,
        sellerId: req.seller.id
      },
      include: [{
        model: models.Category,
        as: 'category',
        attributes: ['id', 'name']
      }]
    });

    if (!product) {
      console.log('❌ Product not found or does not belong to seller');
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    console.log('✅ Product found:', product.name);
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('❌ Error in getSellerProduct:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du produit",
      error: error.message
    });
  }
};

export const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer le profil vendeur avec sa boutique
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId },
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatar'],
          include: [{
            model: models.UserProfile,
            as: 'profile',
            attributes: ['firstName', 'lastName']
          }]
        },
        {
          model: models.Shop,
          as: 'shop',
          attributes: ['id', 'name', 'description', 'logo', 'coverImage', 'rating', 'status', 'location', 'contactInfo']
        }
      ]
    });

    if (!sellerProfile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Calculate stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [monthlyRevenue, totalRevenue, totalOrders, pendingOrders, totalProducts] = await Promise.all([
      models.Order.sum('total', {
        where: {
          sellerId: sellerProfile.id,
          status: 'delivered',
          createdAt: { [Op.gte]: thirtyDaysAgo }
        }
      }),
      models.Order.sum('total', {
        where: {
          sellerId: sellerProfile.id,
          status: 'delivered'
        }
      }),
      models.Order.count({
        where: {
          sellerId: sellerProfile.id
        }
      }),
      models.Order.count({
        where: {
          sellerId: sellerProfile.id,
          status: 'pending'
        }
      }),
      models.Product.count({
        where: {
          sellerId: sellerProfile.id
        }
      })
    ]);

    // Transformer les données pour le frontend
    const transformedProfile = {
      id: sellerProfile.id,
      userId: sellerProfile.userId,
      businessName: sellerProfile.businessName,
      businessInfo: sellerProfile.businessInfo,
      verificationStatus: sellerProfile.verificationStatus,
      subscriptionStatus: sellerProfile.subscriptionStatus,
      subscriptionEndsAt: sellerProfile.subscriptionEndsAt,
      trialEndsAt: sellerProfile.trialEndsAt,
      stats: {
        monthlyRevenue: monthlyRevenue || 0,
        totalRevenue: totalRevenue || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: totalProducts || 0,
        averageRating: sellerProfile.shop?.rating || 0,
        totalCustomers: totalOrders || 0, // Using total orders as proxy for customers
        viewsCount: 0 // Default value, implement view tracking later
      },
      user: {
        id: sellerProfile.user.id,
        name: sellerProfile.user.name,
        email: sellerProfile.user.email,
        avatar: sellerProfile.user.avatar,
        firstName: sellerProfile.user.profile?.firstName,
        lastName: sellerProfile.user.profile?.lastName
      },
      shop: sellerProfile.shop ? {
        id: sellerProfile.shop.id,
        name: sellerProfile.shop.name,
        description: sellerProfile.shop.description,
        logo: sellerProfile.shop.logo,
        coverImage: sellerProfile.shop.coverImage,
        rating: sellerProfile.shop.rating || 0,
        status: sellerProfile.shop.status,
        location: sellerProfile.shop.location,
        contactInfo: sellerProfile.shop.contactInfo
      } : null
    };

    res.status(200).json({
      success: true,
      data: transformedProfile
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil vendeur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil vendeur"
    });
  }
};

export const getSellerShop = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const shop = await models.Shop.findOne({
      where: { sellerId },
      include: [{
        model: models.Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'mainImage', 'description', 'status', 'quantity'],
        where: {
          deletedAt: null
        },
        required: false
      }]
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Boutique non trouvée"
      });
    }

    return res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la boutique:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la boutique"
    });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    console.log('🚀 Starting getPaymentStats');
    console.log('👤 User ID:', req.user?.id);
    console.log('🏪 Seller ID:', req.seller?.id);

    // Vérification de l'authentification
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié"
      });
    }

    // Vérification du profil vendeur
    if (!req.seller) {
      console.log('❌ No seller profile found');
      return res.status(401).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    console.log('🔍 Fetching delivered orders');
    const deliveredOrders = await models.Order.findAll({
      where: { 
        sellerId: req.seller.id,
        status: 'delivered',
        paymentStatus: 'completed'
      },
      attributes: ['id', 'total', 'status', 'paymentStatus'],
      raw: true
    });
    console.log('📦 Delivered orders:', deliveredOrders);

    console.log('🔍 Fetching pending orders');
    const pendingOrders = await models.Order.findAll({
      where: { 
        sellerId: req.seller.id,
        status: 'pending',
        paymentStatus: 'pending'
      },
      attributes: ['id', 'total', 'status', 'paymentStatus'],
      raw: true
    });
    console.log('⏳ Pending orders:', pendingOrders);

    console.log('🔍 Fetching recent withdrawals');
    const recentWithdrawals = await models.Withdrawal.findAll({
      where: {
        sellerId: req.seller.id,
        status: ['completed', 'pending']
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
      raw: true
    });
    console.log('💰 Recent withdrawals:', recentWithdrawals);

    // Calculate stats
    const stats = {
      totalEarnings: deliveredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      totalTransactions: deliveredOrders.length,
      pendingAmount: pendingOrders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      recentWithdrawals: recentWithdrawals
    };

    console.log('📊 Final stats:', stats);

    return res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error in getPaymentStats:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques de paiement",
      error: error.message
    });
  }
};

export const getSellerHistory = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // Vérifier si le vendeur existe
    if (!req.seller || !req.seller.id) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Profil vendeur non trouvé'
      });
    }

    // Construire la requête de base
    const whereClause = {
      sellerId: req.seller.id
    };

    // Ajouter le filtre par type si spécifié
    if (type && type !== 'all') {
      whereClause.type = type;
    }

    // Ajouter le filtre par date si spécifié
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }

    console.log('Recherche avec les critères:', whereClause);

    // Vérifier si le modèle existe
    if (!models.SellerHistory) {
      console.error('Le modèle SellerHistory n\'est pas défini');
      return res.status(500).json({
        success: false,
        message: 'Erreur de configuration du modèle'
      });
    }

    // Récupérer l'historique
    const history = await models.SellerHistory.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 100, // Limiter à 100 entrées par défaut
      include: [{
        model: models.SellerProfile,
        as: 'seller',
        attributes: ['id', 'businessInfo'],
        include: [{
          model: models.User,
          as: 'user',
          attributes: ['name', 'email']
        }]
      }]
    });

    console.log(`${history.length} entrées trouvées dans l'historique`);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

export const getSellerSubCategories = async (req, res) => {
  try {
    console.log('Fetching subcategories for category:', req.params.categoryId);
    
    const { categoryId } = req.params;
    
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de la catégorie est requis"
      });
    }

    // Vérifier si la catégorie existe
    const category = await models.Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Catégorie non trouvée"
      });
    }

    console.log('Category found:', {
      id: category.id,
      name: category.name
    });

    // Récupérer les sous-catégories
    const subcategories = await models.Subcategory.findAll({
      where: { categoryId: category.id },
      attributes: ['id', 'name', 'categoryId'],
      order: [['name', 'ASC']]
    });

    // Formater les données pour la réponse
    const formattedSubcategories = subcategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      categoryId: sub.categoryId
    }));

    console.log('Found subcategories:', formattedSubcategories);

    res.status(200).json({
      success: true,
      data: formattedSubcategories
    });
  } catch (error) {
    console.error('Erreur getSellerSubCategories:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des sous-catégories",
      error: error.message
    });
  }
};

