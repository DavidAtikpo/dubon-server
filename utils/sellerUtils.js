import { models } from '../models/index.js';
import { Op } from 'sequelize';
import sellerConfig from '../config/sellerConfig.js';
import { sendEmail } from './emailUtils.js';
import { sendSMS } from './smsUtils.js';

// Calculer les commissions
export const calculateCommission = (amount) => {
  return amount * sellerConfig.business.commissionRate;
};

// Vérifier les limites
export const checkSellerLimits = async (sellerId) => {
  const productCount = await models.Product.count({
    where: { sellerId }
  });

  return {
    canAddProducts: productCount < sellerConfig.business.maxProductsPerSeller,
    remainingProducts: sellerConfig.business.maxProductsPerSeller - productCount
  };
};

// Vérifier les documents
export const checkDocumentStatus = async (sellerId) => {
  const documents = await models.SellerDocument.findAll({
    where: { sellerId }
  });

  const status = {
    valid: true,
    expiring: [],
    expired: [],
    missing: []
  };

  // Vérifier chaque document requis
  for (const docType of sellerConfig.documents.required) {
    const doc = documents.find(d => d.type === docType);
    
    if (!doc) {
      status.valid = false;
      status.missing.push(docType);
      continue;
    }

    if (doc.verifiedAt) {
      const expiryDays = sellerConfig.documents.expiryDays[docType];
      const expiryDate = new Date(doc.verifiedAt);
      expiryDate.setDate(expiryDate.getDate() + expiryDays);

      const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        status.valid = false;
        status.expired.push(docType);
      } else if (daysUntilExpiry < 30) {
        status.expiring.push({
          type: docType,
          daysRemaining: daysUntilExpiry
        });
      }
    }
  }

  return status;
};

// Mettre à jour les statistiques
export const updateSellerStats = async (sellerId) => {
  const today = new Date().toISOString().split('T')[0];

  const [stats] = await models.SellerStats.findOrCreate({
    where: {
      sellerId,
      date: today
    }
  });

  // Calculer les métriques
  const [
    orderStats,
    productCount,
    ratingStats,
    customerCount
  ] = await Promise.all([
    models.Order.findAll({
      where: { 
        sellerId,
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0,0,0,0))
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total']
      ]
    }),
    models.Product.count({ where: { sellerId } }),
    models.Review.findAll({
      where: { sellerId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average']
      ]
    }),
    models.Order.count({
      where: { sellerId },
      distinct: true,
      col: 'userId'
    })
  ]);

  // Mettre à jour les stats
  await stats.update({
    totalOrders: orderStats[0].count || 0,
    totalRevenue: orderStats[0].total || 0,
    totalProducts: productCount,
    averageRating: ratingStats[0].average || 0,
    totalCustomers: customerCount
  });

  return stats;
};

// Validation des fichiers
export const validateFile = (file, type) => {
  if (!file) return false;

  const isValidSize = file.size <= sellerConfig.upload.maxFileSize;
  const isValidType = sellerConfig.upload.allowedTypes.includes(file.mimetype);

  return isValidSize && isValidType;
};

// Validation des documents vendeur
export const validateSellerDocuments = async (sellerId) => {
  const documents = await models.SellerDocument.findAll({
    where: { sellerId }
  });

  const missingDocs = sellerConfig.documents.required.filter(docType => 
    !documents.find(doc => doc.type === docType)
  );

  const expiredDocs = documents.filter(doc => {
    if (!doc.verifiedAt) return false;
    const expiryDays = sellerConfig.documents.expiryDays[doc.type];
    if (!expiryDays) return false;

    const expiryDate = new Date(doc.verifiedAt);
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    return expiryDate < new Date();
  });

  return {
    isValid: missingDocs.length === 0 && expiredDocs.length === 0,
    missingDocs,
    expiredDocs: expiredDocs.map(doc => ({
      type: doc.type,
      expiredAt: doc.verifiedAt
    }))
  };
};

// Gestion des notifications vendeur
export const notifySellerOrder = async (sellerId, order) => {
  const seller = await models.Seller.findByPk(sellerId, {
    include: [{
      model: models.User,
      attributes: ['email', 'phone']
    }]
  });

  if (!seller) return;

  const notificationData = {
    orderNumber: order.orderNumber,
    total: order.total,
    items: order.items.length
  };

  // Email notification
  if (sellerConfig.notifications.email.orderReceived) {
    await sendEmail({
      to: seller.User.email,
      subject: 'Nouvelle commande reçue',
      template: 'seller-new-order',
      data: notificationData
    });
  }

  // SMS notification
  if (sellerConfig.notifications.sms.orderReceived && seller.User.phone) {
    await sendSMS({
      to: seller.User.phone,
      template: 'seller-new-order',
      data: notificationData
    });
  }
};

// Gestion des stocks
export const checkAndUpdateStock = async (sellerId) => {
  const lowStockProducts = await models.Product.findAll({
    where: {
      sellerId,
      stock: { [Op.lte]: 5 },
      status: 'active'
    }
  });

  if (lowStockProducts.length > 0 && sellerConfig.notifications.email.lowStock) {
    const seller = await models.Seller.findByPk(sellerId, {
      include: [{
        model: models.User,
        attributes: ['email']
      }]
    });

    await sendEmail({
      to: seller.User.email,
      subject: 'Alerte stock bas',
      template: 'seller-low-stock',
      data: { products: lowStockProducts }
    });
  }

  return lowStockProducts;
};

// Calcul des revenus
export const calculateSellerRevenue = async (sellerId, period = '30days') => {
  const dateFilter = {};
  const now = new Date();

  switch (period) {
    case '7days':
      dateFilter[Op.gte] = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      dateFilter[Op.gte] = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      dateFilter[Op.gte] = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const orders = await models.Order.findAll({
    where: {
      sellerId,
      status: 'completed',
      createdAt: dateFilter
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
    ]
  });

  const commission = orders[0].totalRevenue * sellerConfig.business.commissionRate;
  const netRevenue = orders[0].totalRevenue - commission;

  return {
    totalRevenue: orders[0].totalRevenue || 0,
    orderCount: orders[0].orderCount || 0,
    commission,
    netRevenue
  };
};

// Validation du statut vendeur
export const validateSellerStatus = async (sellerId) => {
  const seller = await models.Seller.findByPk(sellerId);
  if (!seller) return false;

  const documentStatus = await validateSellerDocuments(sellerId);
  if (!documentStatus.isValid) return false;

  // Vérifier la période d'essai
  if (seller.subscription?.plan === 'trial') {
    const trialEnd = new Date(seller.subscription.startDate);
    trialEnd.setDate(trialEnd.getDate() + sellerConfig.business.trialPeriodDays);
    
    if (trialEnd < new Date()) {
      await seller.update({
        subscription: {
          ...seller.subscription,
          status: 'expired'
        }
      });
      return false;
    }
  }

  return true;
};

// Mise à jour des métriques vendeur
export const updateSellerMetrics = async (sellerId) => {
  const [
    orderStats,
    productStats,
    customerStats,
    reviewStats
  ] = await Promise.all([
    calculateSellerRevenue(sellerId),
    models.Product.count({ where: { sellerId } }),
    models.Order.count({
      where: { sellerId },
      distinct: true,
      col: 'userId'
    }),
    models.Review.findAll({
      where: { sellerId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
      ]
    })
  ]);

  await models.SellerStats.create({
    sellerId,
    date: new Date(),
    totalOrders: orderStats.orderCount,
    totalRevenue: orderStats.totalRevenue,
    totalProducts: productStats,
    totalCustomers: customerStats,
    averageRating: reviewStats[0].averageRating || 0,
    metrics: {
      commission: orderStats.commission,
      netRevenue: orderStats.netRevenue,
      totalReviews: reviewStats[0].totalReviews
    }
  });
}; 