import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/emailSender.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const { User, Seller, Product, Order, Review, SystemLog, SystemSettings, SellerProfile, Theme, Formation, Inscription } = models;

// Fonctions utilitaires
async function calculateTotalRevenue() {
  const result = await Order.sum('total', {
    where: { status: 'completed' }
  });
  return result || 0;
}

async function getRecentOrders(limit = 10) {
  return Order.findAll({
    limit,
    include: ['customer'],
    order: [['createdAt', 'DESC']]
  });
}

// Authentification
export const adminlogin = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await models.User.findOne({
      where: { 
        email,
        role: 'admin',
        status: 'active'
      },
      attributes: ['id', 'email', 'role', 'status','name']
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Email incorrect ou compte non autorisé"
      });
    }

    // Générer access token et refresh token
    const accessToken = jwt.sign(
      { id: admin.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
      { id: admin.id }, 
      process.env.REFRESH_TOKEN_SECRET, 
      { expiresIn: '7d' }
    );

    // Sauvegarder le refresh token dans la base de données
    await models.User.update(
      { refreshToken: refreshToken },
      { where: { id: admin.id } }
    );

    // Envoyer les tokens et les infos admin
    res.json({ 
      success: true, 
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Erreur login admin:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Ajouter une fonction pour rafraîchir le token admin
export const refreshAdminToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant'
      });
    }

    const admin = await User.findOne({
      where: { 
        refreshToken,
        role: 'admin',
        status: 'active'
      }
    });

    if (!admin) {
      return res.status(403).json({
        success: false,
        message: 'Refresh token invalide ou compte non autorisé'
      });
    }

    // Vérifier le refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Refresh token invalide'
        });
      }

      // Générer un nouveau access token
      const newAccessToken = jwt.sign(
        { id: admin.id }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      res.json({
        success: true,
        accessToken: newAccessToken
      });
    });
  } catch (error) {
    console.error('Erreur refresh token admin:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Dashboard
export const getDashboard = async (req, res) => {
  try {
    const stats = {
      users: await User.count(),
      orders: await Order.count(),
      products: await Product.count(),
      sellers: await SellerProfile.count(),
      revenue: await calculateTotalRevenue(),
      recentOrders: await getRecentOrders(5)
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    

    // Statistiques des utilisateurs (correction pour compter tous les utilisateurs sauf admin)
    const totalUsers = await User.count({
      where: { 
        role: {
          [Op.ne]: 'admin'  // Ne pas compter les admins
        }
      }
    });
    
    
    const newUsers = await User.count({
      where: {
        role: {
          [Op.ne]: 'admin'  // Ne pas compter les admins
        },
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    

    // Statistiques des vendeurs
    const totalSellers = await User.count({
      where: { role: 'seller' }
    });
    
    
    const pendingSellers = await models.SellerRequest.count({
      where: { status: 'pending' }
    });
    

    // Statistiques des produits
    const totalProducts = await Product.count();
    

    // Statistiques des commandes
    const totalOrders = await Order.count();
    

    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    

    // Statistiques des revenus (correction du statut)
    const totalRevenue = await Order.sum('total', {
      where: { 
        status: 'COMPLETED'  // Utiliser la bonne valeur de l'enum
      }
    }) || 0;
    console.log('Revenu total:', totalRevenue);

    const todayRevenue = await Order.sum('total', {
      where: {
        status: 'COMPLETED',  // Utiliser la bonne valeur de l'enum
        createdAt: {
          [Op.gte]: today
        }
      }
    }) || 0;
    

    const responseData = {
      success: true,
      data: {
        users: {
          total: totalUsers,
          new: newUsers
        },
        sellers: {
          total: totalSellers,
          pending: pendingSellers
        },
        products: {
          total: totalProducts
        },
        orders: {
          total: totalOrders,
          today: todayOrders
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue
        }
      }
    };

    
    res.json(responseData);

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Gestion des utilisateurs
export const getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const where = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    const users = await User.findAll({
      where,
      attributes: [
        'id', 
        'name', 
        'email',
        'phone',
        'role',
        'status',
        'avatar',
        'lastLogin',
        'createdAt',
        [
          models.sequelize.literal(`(
            SELECT COUNT(*) 
            FROM Orders 
            WHERE Orders.userId = User.id
          )`),
            'totalOrders'
          ],
          [
          models.sequelize.literal(`(
            SELECT COALESCE(SUM(total), 0) 
            FROM Orders 
            WHERE Orders.userId = User.id
          )`),
            'totalSpent'
          ],
          [
          models.sequelize.literal(`(
            SELECT COUNT(*) 
            FROM Reviews 
            WHERE Reviews.userId = User.id
          )`),
            'reviewCount'
          ]
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: users
    });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération des utilisateurs"
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    console.log('=== Début getUserById ===');
    console.log('ID utilisateur recherché:', req.params.id);

    const user = await models.User.findOne({
      where: { id: req.params.id },
      attributes: [
        'id', 
        'name', 
        'email', 
        'role', 
        'status', 
        'createdAt',
        'phone',
        'address'
      ]
    });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    console.log('Utilisateur trouvé:', user.id);

    res.json({ 
      success: true, 
      data: user
    });

  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération de l'utilisateur",
      error: error.message 
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log('=== Début updateUser ===');
    console.log('ID utilisateur à mettre à jour:', req.params.id);
    console.log('Données de mise à jour:', req.body);

    const user = await models.User.findByPk(req.params.id);

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    // Vérifier qu'on ne modifie pas le dernier admin
    if (user.role === 'admin' && req.body.role !== 'admin') {
      const adminCount = await models.User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de modifier le dernier administrateur'
        });
      }
    }

    // Mise à jour des champs autorisés
    const allowedUpdates = ['name', 'role', 'status', 'phone', 'address'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    await user.update(updates);
    console.log('Utilisateur mis à jour avec succès');

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: user
    });

  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error: error.message
    });
  }
};

// Gestion des vendeurs
export const getSellers = async (req, res) => {
  try {
    const sellers = await SellerProfile.findAll({
      include: ['user', 'products'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await SellerProfile.findByPk(req.params.id, {
      include: ['user', 'products', 'orders']
    });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }
    res.json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des commandes
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: ['customer', 'items', 'seller'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Paramètres système
export const getSystemSettings = async (req, res) => {
  try {
    console.log('=== Début getSystemSettings ===');

    // Paramètres par défaut
    const defaultSettings = {
      general: {
        siteName: 'Dubon',
        siteDescription: 'Plateforme de commerce en ligne',
        contactEmail: 'contact@dubon.com',
        phoneNumber: '',
        address: ''
      },
      features: {
        enableRegistration: true,
        enableReviews: true,
        enableChat: true,
        maintenanceMode: false
      },
      email: {
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        senderEmail: process.env.SENDER_EMAIL || 'noreply@dubon.com',
        senderName: 'Dubon'
      },
      social: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: ''
      }
    };

    // Récupérer les paramètres de la base de données
    const settings = await models.SystemSettings.findOne({
      where: { key: 'general_settings' },
      include: [{
        model: models.User,
        as: 'lastUpdatedBy',
        attributes: ['id', 'name']
      }]
    });

    // Si aucun paramètre n'existe, créer les paramètres par défaut
    if (!settings) {
      await models.SystemSettings.create({
        key: 'general_settings',
        value: defaultSettings,
        category: 'general',
        description: 'Paramètres généraux du système',
        updated_by: req.user?.id
      });
    }

    // Fusionner les paramètres
    const finalSettings = settings ? 
      { ...defaultSettings, ...JSON.parse(settings.value) } : 
      defaultSettings;

    console.log('Paramètres récupérés avec succès');
    
    res.json({
      success: true,
      data: {
        settings: finalSettings,
        lastUpdate: settings ? {
          date: settings.updatedAt,
          by: settings.lastUpdatedBy
        } : null
      }
    });

  } catch (error) {
    console.error('Erreur getSystemSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    console.log('=== Début updateSystemSettings ===');
    console.log('Nouveaux paramètres:', req.body);

    // Valider les paramètres reçus
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Paramètres invalides'
      });
    }

    // Mettre à jour ou créer les paramètres
    await SystemSettings.upsert({
      id: 1, // ID par défaut pour les paramètres système
      value: JSON.stringify(req.body),
      updatedBy: req.user.id
    });
    console.log('Paramètres mis à jour avec succès');

    res.json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur updateSystemSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
};

// Logs système
export const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des demandes vendeurs
export const getSellerRequests = async (req, res) => {
  try {
    const requests = await models.SellerRequest.findAll({
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['id', 'email', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSellerRequestById = async (req, res) => {
  try {
    const request = await models.SellerRequest.findByPk(req.params.id, {
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['id', 'email', 'name']
      }]
    });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveSellerRequest = async (req, res) => {
  try {
    const request = await models.SellerRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    await sequelize.transaction(async (t) => {
      // Mettre à jour la demande
      await request.update({
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction: t });

      // Mettre à jour le rôle de l'utilisateur
      await models.User.update({
        role: 'seller',
        status: 'active'
      }, {
        where: { id: request.userId },
        transaction: t
      });
    });

    res.json({ success: true, message: 'Demande approuvée avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const rejectSellerRequest = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const request = await models.SellerRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    await request.update({
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason
    });

    res.json({ success: true, message: 'Demande rejetée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await models.User.findAll({
      where: { 
        role: 'seller',
        status: 'pending'
      },
      include: [{
        model: models.SellerRequest,
        as: 'sellerRequest'
      }]
    });
    res.json({ success: true, data: pendingSellers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveSellers = async (req, res) => {
  try {
    const activeSellers = await models.User.findAll({
      where: { 
        role: 'seller',
        status: 'active'
      },
      include: [{
        model: models.SellerRequest,
        as: 'sellerRequest'
      }]
    });
    res.json({ success: true, data: activeSellers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des thèmes
export const getThemes = async (req, res) => {
  try {
    console.log('=== Début getThemes ===');

    const themes = await models.Theme.findAll({
      order: [['createdAt', 'DESC']]
    });

    console.log('Nombre de thèmes trouvés:', themes.length);

    res.json({
      success: true,
      data: themes
    });

  } catch (error) {
    console.error('Erreur getThemes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des thèmes',
      error: error.message
    });
  }
};

export const activateTheme = async (req, res) => {
  try {
    console.log('=== Début activateTheme ===');
    console.log('Theme ID:', req.params.id);

    // Désactiver tous les thèmes
    await models.Theme.update(
      { isActive: false },
      { where: {} }
    );

    // Activer le thème sélectionné
    const theme = await models.Theme.findByPk(req.params.id);
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Thème non trouvé'
      });
    }

    await theme.update({ isActive: true });
    console.log('Thème activé avec succès');

    res.json({
      success: true,
      message: 'Thème activé avec succès',
      data: theme
    });

  } catch (error) {
    console.error('Erreur activateTheme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du thème',
      error: error.message
    });
  }
};

export const deleteTheme = async (req, res) => {
  try {
    console.log('=== Début deleteTheme ===');
    console.log('Theme ID:', req.params.id);

    const theme = await models.Theme.findByPk(req.params.id);
    
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Thème non trouvé'
      });
    }

    if (theme.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer le thème actif'
      });
    }

    // Supprimer les fichiers du thème
    if (theme.thumbnail) {
      const thumbnailPath = path.join(process.cwd(), 'public', theme.thumbnail);
      await fs.unlink(thumbnailPath).catch(err => console.error('Erreur suppression thumbnail:', err));
    }

    await theme.destroy();
    console.log('Thème supprimé avec succès');

    res.json({
      success: true,
      message: 'Thème supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteTheme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du thème',
      error: error.message
    });
  }
};

export const uploadTheme = async (req, res) => {
  try {
    console.log('=== Début uploadTheme ===');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Traitement du fichier ZIP du thème
    const themeData = {
      name: req.body.name || 'Nouveau thème',
      description: req.body.description || 'Description du thème',
      version: req.body.version || '1.0.0',
      author: req.body.author || 'Admin',
      thumbnail: req.file.filename,
      customization: {
        colors: {
          primary: '#000000',
          secondary: '#ffffff',
          accent: '#0066cc'
        },
        fonts: {
          heading: 'Arial',
          body: 'Arial'
        }
      }
    };

    const theme = await models.Theme.create(themeData);
    console.log('Thème créé avec succès');

    res.json({
      success: true,
      message: 'Thème uploadé avec succès',
      data: theme
    });

  } catch (error) {
    console.error('Erreur uploadTheme:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du thème',
      error: error.message
    });
  }
};

export const updateThemeCustomization = async (req, res) => {
  try {
    console.log('=== Début updateThemeCustomization ===');
    console.log('Theme ID:', req.params.id);
    console.log('Nouvelles personnalisations:', req.body);

    const theme = await models.Theme.findByPk(req.params.id);
    
    if (!theme) {
      return res.status(404).json({
        success: false,
        message: 'Thème non trouvé'
      });
    }

    await theme.update({
      customization: {
        ...theme.customization,
        ...req.body
      }
    });

    console.log('Personnalisations mises à jour avec succès');

    res.json({
      success: true,
      message: 'Personnalisations mises à jour avec succès',
      data: theme
    });

  } catch (error) {
    console.error('Erreur updateThemeCustomization:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des personnalisations',
      error: error.message
    });
  }
};

// Gestion de la maintenance
export const startMaintenance = async (req, res) => {
  try {
    console.log('=== Début startMaintenance ===');
    const { reason, estimatedDuration } = req.body;

    // Récupérer les paramètres actuels
    let settings = await SystemSettings.findOne({ where: { id: 1 } });
    let currentSettings = settings ? JSON.parse(settings.value) : {};

    // Mettre à jour uniquement la partie maintenance
    const updatedSettings = {
      ...currentSettings,
      maintenance: {
        active: true,
        reason,
        estimatedDuration,
        startedAt: new Date(),
        startedBy: req.user.id
      }
    };

    // Sauvegarder les paramètres mis à jour
    await SystemSettings.upsert({
      id: 1,
      value: JSON.stringify(updatedSettings),
      updatedBy: req.user.id
    });

    // Logger l'action
    await SystemLog.create({
      action: 'MAINTENANCE_START',
      details: { reason, estimatedDuration },
      userId: req.user.id
    });

    console.log('Mode maintenance activé');

    res.json({
      success: true,
      message: 'Mode maintenance activé',
      data: updatedSettings.maintenance
    });

  } catch (error) {
    console.error('Erreur startMaintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du mode maintenance',
      error: error.message
    });
  }
};

export const endMaintenance = async (req, res) => {
  try {
    console.log('=== Début endMaintenance ===');

    // Récupérer les paramètres actuels
    let settings = await SystemSettings.findOne({ where: { id: 1 } });
    let currentSettings = settings ? JSON.parse(settings.value) : {};

    // Mettre à jour uniquement la partie maintenance
    const updatedSettings = {
      ...currentSettings,
      maintenance: {
        active: false,
        endedAt: new Date(),
        endedBy: req.user.id
      }
    };

    // Sauvegarder les paramètres mis à jour
    await SystemSettings.upsert({
      id: 1,
      value: JSON.stringify(updatedSettings),
      updatedBy: req.user.id
    });

    // Logger l'action
    await SystemLog.create({
      action: 'MAINTENANCE_END',
      details: { endedAt: new Date() },
      userId: req.user.id
    });

    console.log('Mode maintenance désactivé');

    res.json({
      success: true,
      message: 'Mode maintenance désactivé',
      data: updatedSettings.maintenance
    });

  } catch (error) {
    console.error('Erreur endMaintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation du mode maintenance',
      error: error.message
    });
  }
};

export const getMaintenanceStatus = async (req, res) => {
  try {
    console.log('=== Début getMaintenanceStatus ===');

    const settings = await SystemSettings.findOne({ where: { id: 1 } });
    const currentSettings = settings ? JSON.parse(settings.value) : {};

    res.json({
      success: true,
      data: {
        maintenance: currentSettings.maintenance || {
          active: false
        }
      }
    });

  } catch (error) {
    console.error('Erreur getMaintenanceStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut de maintenance',
      error: error.message
    });
  }
};

export const performSystemCleanup = async (req, res) => {
  try {
    console.log('=== Début performSystemCleanup ===');
    const tasks = [];

    // 1. Nettoyer les fichiers temporaires
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.rm(tempDir, { recursive: true, force: true })
      .then(() => tasks.push('Fichiers temporaires supprimés'))
      .catch(err => console.error('Erreur nettoyage temp:', err));

    // 2. Nettoyer les sessions expirées
    await models.Session.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() }
      }
    }).then(count => tasks.push(`${count} sessions expirées supprimées`));

    // 3. Nettoyer les tokens expirés
    await models.User.update(
      { refreshToken: null },
      {
        where: {
          refreshTokenExpiresAt: { [Op.lt]: new Date() }
        }
      }
    ).then(count => tasks.push(`${count} tokens expirés nettoyés`));

    // 4. Nettoyer les vieux logs système
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    await SystemLog.destroy({
      where: {
        createdAt: { [Op.lt]: thirtyDaysAgo }
      }
    }).then(count => tasks.push(`${count} vieux logs système supprimés`));

    // Logger l'action de nettoyage
    await SystemLog.create({
      action: 'SYSTEM_CLEANUP',
      details: { tasks },
      userId: req.user.id
    });

    console.log('Nettoyage système terminé');
    console.log('Tâches effectuées:', tasks);

    res.json({
      success: true,
      message: 'Nettoyage système terminé avec succès',
      data: { tasks }
    });

  } catch (error) {
    console.error('Erreur performSystemCleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage système',
      error: error.message
    });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    // Construire la clause where
    const whereClause = {};
    
    // Filtre par type si spécifié
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    // Filtre par date si spécifié
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Récupérer les logs avec pagination
    const logs = await models.SystemLog.findAll({
      where: whereClause,
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['id', 'name'],
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: 100 // Limiter à 100 logs par requête
    });

    // Logger l'action de consultation des logs
    await models.SystemLog.create({
      type: 'system',
      action: 'LOGS_VIEW',
      description: 'Consultation des logs système',
      severity: 'info',
      userId: req.user?.id,
      metadata: {
        filters: { type, startDate, endDate },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          type: log.type,
          action: log.action,
          description: log.description,
          severity: log.severity,
          userId: log.userId,
          metadata: log.metadata,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
          user: log.user ? {
            id: log.user.id,
            name: log.user.name
          } : null
        }))
      }
    });

  } catch (error) {
    console.error('Erreur getLogs:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des logs",
      error: error.message
    });
  }
};

// Fonction utilitaire pour créer un log système
export const createSystemLog = async ({
  type,
  action,
  description,
  severity = 'info',
  userId = null,
  metadata = {},
  ipAddress,
  userAgent
}) => {
  try {
    return await models.SystemLog.create({
      type,
      action,
      description,
      severity,
      userId,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    console.error('Erreur createSystemLog:', error);
    // Ne pas throw l'erreur pour ne pas interrompre le flux principal
    return null;
  }
};

// Fonction pour nettoyer les vieux logs
export const cleanOldLogs = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Garder les logs critiques et d'erreur plus longtemps
    await models.SystemLog.destroy({
      where: {
        createdAt: { [Op.lt]: thirtyDaysAgo },
        severity: { [Op.notIn]: ['critical', 'error'] }
      }
    });

    console.log('Nettoyage des vieux logs effectué');
  } catch (error) {
    console.error('Erreur cleanOldLogs:', error);
  }
};

// Ajouter cette fonction pour gérer le stock
export const getStockStatus = async (req, res) => {
  try {
    console.log('=== Début getStockStatus ===');

    // Récupérer les produits avec stock bas
    const lowStockProducts = await models.Product.findAll({
      where: {
        quantity: {
          [Op.lte]: sequelize.col('lowStockThreshold')
        },
        status: 'active'
      },
      include: [{
        model: models.SellerProfile,
        as: 'seller',
        attributes: ['id', 'businessName']
      }],
      attributes: [
        'id',
        'name',
        'sku',
        'quantity',
        'lowStockThreshold',
        'mainImage'
      ]
    });

    // Récupérer les produits en rupture de stock
    const outOfStockProducts = await models.Product.findAll({
      where: {
        quantity: 0,
        status: 'active'
      },
      include: [{
        model: models.SellerProfile,
        as: 'seller',
        attributes: ['id', 'businessName']
      }],
      attributes: [
        'id',
        'name',
        'sku',
        'quantity',
        'mainImage'
      ]
    });

    // Statistiques globales du stock
    const stockStats = await models.Product.findAll({
      where: { status: 'active' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalStock'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
        [sequelize.fn('AVG', sequelize.col('quantity')), 'averageStock'],
        [
          sequelize.fn('COUNT', 
            sequelize.literal('CASE WHEN quantity <= "lowStockThreshold" THEN 1 END')
          ), 
          'lowStockCount'
        ],
        [
          sequelize.fn('COUNT', 
            sequelize.literal('CASE WHEN quantity = 0 THEN 1 END')
          ), 
          'outOfStockCount'
        ]
      ],
      raw: true
    });

    // Logger l'action
    await models.SystemLog.create({
      type: 'inventory',
      action: 'STOCK_STATUS_VIEW',
      description: 'Consultation du statut des stocks',
      severity: 'info',
      userId: req.user?.id,
      metadata: {
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      }
    });

    res.json({
      success: true,
      data: {
        lowStockProducts: lowStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.quantity,
          threshold: product.lowStockThreshold,
          mainImage: product.mainImage,
          seller: product.seller ? {
            id: product.seller.id,
            name: product.seller.businessName
          } : null
        })),
        outOfStockProducts: outOfStockProducts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          mainImage: product.mainImage,
          seller: product.seller ? {
            id: product.seller.id,
            name: product.seller.businessName
          } : null
        })),
        stats: {
          totalStock: parseInt(stockStats[0].totalStock) || 0,
          totalProducts: parseInt(stockStats[0].totalProducts) || 0,
          averageStock: Math.round(parseFloat(stockStats[0].averageStock)) || 0,
          lowStockCount: parseInt(stockStats[0].lowStockCount) || 0,
          outOfStockCount: parseInt(stockStats[0].outOfStockCount) || 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur getStockStatus:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du statut des stocks",
      error: error.message
    });
  }
};

// Gestion des formations
export const getAllFormations = async (req, res) => {
  try {
    const formations = await models.Formation.findAll({
      include: [{
        model: models.User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: formations
    });
  } catch (error) {
    console.error('Erreur getAllFormations:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des formations"
    });
  }
};

export const getFormationById = async (req, res) => {
  try {
    const formation = await models.Formation.findByPk(req.params.id, {
      include: [
        {
          model: models.User,
          as: 'instructor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: models.Inscription,
          include: [{
            model: models.User,
            attributes: ['id', 'name', 'email', 'phone']
          }]
        }
      ]
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Erreur getFormationById:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la formation"
    });
  }
};

export const approveFormation = async (req, res) => {
  try {
    const formation = await models.Formation.findByPk(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    await formation.update({ status: 'active' });

    // Logger l'action
    await createSystemLog({
      type: 'formation',
      action: 'FORMATION_APPROVED',
      description: `Formation ${formation.title} approuvée`,
      userId: req.user.id,
      metadata: { formationId: formation.id }
    });

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Erreur approveFormation:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'approbation de la formation"
    });
  }
};

export const cancelFormation = async (req, res) => {
  try {
    const formation = await models.Formation.findByPk(req.params.id);

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: "Formation non trouvée"
      });
    }

    await formation.update({ status: 'cancelled' });

    // Annuler toutes les inscriptions en attente
    await models.Inscription.update(
      { status: 'cancelled' },
      {
        where: {
          formationId: req.params.id,
          status: 'pending'
        }
      }
    );

    // Logger l'action
    await createSystemLog({
      type: 'formation',
      action: 'FORMATION_CANCELLED',
      description: `Formation ${formation.title} annulée`,
      userId: req.user.id,
      metadata: { formationId: formation.id }
    });

    res.json({
      success: true,
      data: formation
    });
  } catch (error) {
    console.error('Erreur cancelFormation:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de la formation"
    });
  }
};

// Gestion des inscriptions
export const getAllInscriptions = async (req, res) => {
  try {
    const inscriptions = await models.Inscription.findAll({
      include: [
        {
          model: models.User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: models.Formation,
          include: [{
            model: models.User,
            as: 'instructor',
            attributes: ['id', 'name', 'email']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: inscriptions
    });
  } catch (error) {
    console.error('Erreur getAllInscriptions:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des inscriptions"
    });
  }
};

export const confirmInscription = async (req, res) => {
  try {
    const inscription = await models.Inscription.findByPk(req.params.id, {
      include: [{ model: models.Formation }]
    });

    if (!inscription) {
      return res.status(404).json({
        success: false,
        message: "Inscription non trouvée"
      });
    }

    await inscription.update({ status: 'confirmed' });

    // Mettre à jour le nombre de participants
    await models.Formation.increment('currentParticipants', {
      where: { id: inscription.formationId }
    });

    // Logger l'action
    await createSystemLog({
      type: 'inscription',
      action: 'INSCRIPTION_CONFIRMED',
      description: `Inscription confirmée pour la formation ${inscription.Formation.title}`,
      userId: req.user.id,
      metadata: { 
        inscriptionId: inscription.id,
        formationId: inscription.formationId 
      }
    });

    res.json({
      success: true,
      data: inscription
    });
  } catch (error) {
    console.error('Erreur confirmInscription:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation de l'inscription"
    });
  }
};

export const cancelInscription = async (req, res) => {
  try {
    const inscription = await models.Inscription.findByPk(req.params.id);

    if (!inscription) {
      return res.status(404).json({
        success: false,
        message: "Inscription non trouvée"
      });
    }

    await inscription.update({
      status: 'cancelled',
      paymentStatus: 'refunded'
    });

    // Logger l'action
    await createSystemLog({
      type: 'inscription',
      action: 'INSCRIPTION_CANCELLED',
      description: `Inscription annulée`,
      userId: req.user.id,
      metadata: { inscriptionId: inscription.id }
    });

    res.json({
      success: true,
      data: inscription
    });
  } catch (error) {
    console.error('Erreur cancelInscription:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de l'inscription"
    });
  }
};

// Gestion des événements
export const getAllEvents = async (req, res) => {
  try {
    const events = await models.Event.findAll({
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Erreur getAllEvents:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des événements"
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await models.Event.findByPk(req.params.id, {
      include: [
        {
          model: models.User,
          as: 'seller',
          attributes: ['id', 'name', 'email']
        },
        {
          model: models.Booking,
          include: [{
            model: models.User,
            attributes: ['id', 'name', 'email', 'phone']
          }]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur getEventById:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'événement"
    });
  }
};

export const approveEvent = async (req, res) => {
  try {
    const event = await models.Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    await event.update({ status: 'published' });

    // Logger l'action
    await createSystemLog({
      type: 'event',
      action: 'EVENT_APPROVED',
      description: `Événement ${event.title} approuvé`,
      userId: req.user.id,
      metadata: { eventId: event.id }
    });

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur approveEvent:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'approbation de l'événement"
    });
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const event = await models.Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    await event.update({ status: 'cancelled' });

    // Annuler toutes les réservations en attente
    await models.Booking.update(
      { status: 'cancelled' },
      {
        where: {
          eventId: req.params.id,
          status: 'pending'
        }
      }
    );

    // Logger l'action
    await createSystemLog({
      type: 'event',
      action: 'EVENT_CANCELLED',
      description: `Événement ${event.title} annulé`,
      userId: req.user.id,
      metadata: { eventId: event.id }
    });

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur cancelEvent:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de l'événement"
    });
  }
};

// Gestion des réservations d'événements
export const getAllEventBookings = async (req, res) => {
  try {
    const bookings = await models.Booking.findAll({
      include: [
        {
          model: models.User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: models.Event,
          include: [{
            model: models.User,
            as: 'seller',
            attributes: ['id', 'name', 'email']
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Erreur getAllEventBookings:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations"
    });
  }
};

export const getEventBookingById = async (req, res) => {
  try {
    const booking = await models.Booking.findByPk(req.params.id, {
      include: [
        {
          model: models.User,
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: models.Event,
          include: [{
            model: models.User,
            as: 'seller',
            attributes: ['id', 'name', 'email']
          }]
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur getEventBookingById:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la réservation"
    });
  }
};

export const confirmEventBooking = async (req, res) => {
  try {
    const booking = await models.Booking.findByPk(req.params.id, {
      include: [{ model: models.Event }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    await booking.update({ status: 'confirmed' });

    // Mettre à jour le nombre de participants
    await models.Event.increment('currentBookings', {
      where: { id: booking.eventId }
    });

    // Logger l'action
    await createSystemLog({
      type: 'booking',
      action: 'BOOKING_CONFIRMED',
      description: `Réservation confirmée pour l'événement ${booking.Event.title}`,
      userId: req.user.id,
      metadata: { 
        bookingId: booking.id,
        eventId: booking.eventId 
      }
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur confirmEventBooking:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation de la réservation"
    });
  }
};

export const cancelEventBooking = async (req, res) => {
  try {
    const booking = await models.Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }

    await booking.update({
      status: 'cancelled',
      paymentStatus: 'refunded'
    });

    // Logger l'action
    await createSystemLog({
      type: 'booking',
      action: 'BOOKING_CANCELLED',
      description: `Réservation annulée`,
      userId: req.user.id,
      metadata: { bookingId: booking.id }
    });

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Erreur cancelEventBooking:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation de la réservation"
    });
  }
};

// Gestion des vendeurs par type
export const getSellersByType = async (req, res) => {
  try {
    const { type } = req.params; // 'restaurant', 'event', 'formation', 'service'
    const sellers = await models.SellerProfile.findAll({
      where: { 
        businessType: type,
        status: { [Op.not]: 'deleted' }
      },
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email', 'phone', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('Erreur getSellersByType:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des vendeurs"
    });
  }
};

// Gestion des demandes d'inscription vendeur
export const getPendingSellerRequests = async (req, res) => {
  try {
    const requests = await models.SellerRequest.findAll({
      where: { status: 'pending' },
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email', 'phone']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Erreur getPendingSellerRequests:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes"
    });
  }
};

// Approuver/Rejeter une demande vendeur
export const handleSellerRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, reason } = req.body; // 'approve' ou 'reject'

    const request = await models.SellerRequest.findByPk(requestId, {
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Demande non trouvée"
      });
    }

    if (action === 'approve') {
      // Mettre à jour le statut de la demande
      await request.update({ status: 'approved' });
      
      // Mettre à jour le rôle de l'utilisateur
      await models.User.update(
        { role: 'seller' },
        { where: { id: request.userId } }
      );

      // Créer le profil vendeur
      await models.SellerProfile.create({
        userId: request.userId,
        businessName: request.businessName,
        businessType: request.businessType,
        status: 'active'
      });

      // Envoyer un email de confirmation
      await sendEmail({
        to: request.User.email,
        subject: 'Votre demande vendeur a été approuvée',
        template: 'seller-approved',
        context: {
          name: request.User.name,
          businessType: request.businessType
        }
      });
    } else {
      // Rejeter la demande
      await request.update({ 
        status: 'rejected',
        rejectionReason: reason
      });

      // Envoyer un email de rejet
      await sendEmail({
        to: request.User.email,
        subject: 'Votre demande vendeur a été rejetée',
        template: 'seller-rejected',
        context: {
          name: request.User.name,
          reason: reason
        }
      });
    }

    // Logger l'action
    await createSystemLog({
      type: 'seller',
      action: action === 'approve' ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
      description: `Demande vendeur ${action === 'approve' ? 'approuvée' : 'rejetée'} pour ${request.User.name}`,
      userId: req.user.id,
      metadata: { 
        requestId,
        sellerId: request.userId,
        businessType: request.businessType
      }
    });

    res.json({
      success: true,
      message: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`
    });
  } catch (error) {
    console.error('Erreur handleSellerRequest:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du traitement de la demande"
    });
  }
};

// Suspendre/Réactiver un vendeur
export const updateSellerStatus = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, reason } = req.body; // 'active', 'suspended', 'banned'

    const seller = await models.SellerProfile.findByPk(sellerId, {
      include: [{
        model: models.User,
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    await seller.update({ 
      status,
      statusReason: reason
    });

    // Envoyer une notification au vendeur
    await sendEmail({
      to: seller.User.email,
      subject: `Votre compte vendeur a été ${status}`,
      template: 'seller-status-update',
      context: {
        name: seller.User.name,
        status,
        reason
      }
    });

    // Logger l'action
    await createSystemLog({
      type: 'seller',
      action: 'SELLER_STATUS_UPDATED',
      description: `Statut du vendeur mis à jour: ${status}`,
      userId: req.user.id,
      metadata: { 
        sellerId,
        status,
        reason
      }
    });

    res.json({
      success: true,
      message: "Statut du vendeur mis à jour avec succès"
    });
  } catch (error) {
    console.error('Erreur updateSellerStatus:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut"
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    // Vérifier que le statut est valide
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide"
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await models.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Empêcher la modification d'un admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Impossible de modifier le statut d'un administrateur"
      });
    }

    // Mettre à jour le statut
    await user.update({ status });

    // Enregistrer l'historique du changement
    await models.UserStatusHistory.create({
      userId,
      oldStatus: user.status,
      newStatus: status,
      reason,
      performedById: req.user.id
    });

    res.json({
      success: true,
      message: "Statut mis à jour avec succès"
    });

  } catch (error) {
    console.error('Erreur updateUserStatus:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message
    });
  }
};

// Obtenir les statistiques des utilisateurs
export const getUserStats = async (req, res) => {
  try {
    const stats = await User.findAll({
      attributes: [
        'role',
        'status',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
      ],
      group: ['role', 'status']
    });

    const newUsersCount = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
        }
      }
    });

    const activeUsersCount = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
        }
      }
    });

    res.json({
      success: true,
      data: {
        stats,
        newUsersCount,
        activeUsersCount
      }
    });
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

// Obtenir l'historique des changements de statut d'un utilisateur
export const getUserStatusHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const history = await models.UserStatusHistory.findAll({
      where: { userId },
      include: [{
        model: User,
        as: 'changedByUser',
        attributes: ['name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Erreur getUserStatusHistory:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique"
    });
  }
};

export default {
  adminlogin,
  getDashboard,
  getDashboardStats,
  getUsers,
  getUserById,
  getSellers,
  getSellerById,
  getOrders,
  getSystemSettings,
  updateSystemSettings,
  getSystemLogs,
  getThemes,
  activateTheme,
  deleteTheme,
  uploadTheme,
  updateThemeCustomization,
  startMaintenance,
  endMaintenance,
  performSystemCleanup,
  getMaintenanceStatus,
  getLogs,
  createSystemLog,
  cleanOldLogs,
  getStockStatus,
  getAllFormations,
  getFormationById,
  approveFormation,
  cancelFormation,
  getAllInscriptions,
  confirmInscription,
  cancelInscription,
  getAllEvents,
  getEventById,
  approveEvent,
  cancelEvent,
  getAllEventBookings,
  getEventBookingById,
  confirmEventBooking,
  cancelEventBooking,
  getSellersByType,
  getPendingSellerRequests,
  handleSellerRequest,
  updateSellerStatus,
  updateUserStatus,
  getUserStats,
  getUserStatusHistory
};