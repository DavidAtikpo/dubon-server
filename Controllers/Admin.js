import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import sequelize from 'sequelize';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/emailSender.js';
import crypto from 'crypto';

const { User, Seller, Product, Order, Review, SystemLog, SystemSettings, SellerProfile } = models;

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
export const login = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await User.findOne({
      where: { 
        email, 
        role: 'admin',
        status: 'active'
      }
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
    await User.update(
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
    const lastMonth = new Date(today.setMonth(today.getMonth() - 1));

    const stats = {
      users: {
        total: await User.count(),
        new: await User.count({
          where: { createdAt: { [Op.gte]: lastMonth } }
        })
      },
      orders: {
        total: await Order.count(),
        recent: await Order.count({
          where: { createdAt: { [Op.gte]: lastMonth } }
        }),
        revenue: await calculateTotalRevenue()
      },
      sellers: {
        total: await SellerProfile.count(),
        pending: await SellerProfile.count({
          where: { status: 'pending' }
        })
      }
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des utilisateurs
export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: ['profile'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: ['profile', 'orders']
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    const settings = await SystemSettings.findAll();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    const { key, value } = req.body;
    await SystemSettings.upsert({ key, value });
    res.json({ success: true, message: 'Paramètres mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

export default {
  login,
  getDashboard,
  getDashboardStats,
  getUsers,
  getUserById,
  getSellers,
  getSellerById,
  getOrders,
  getSystemSettings,
  updateSystemSettings,
  getSystemLogs
};