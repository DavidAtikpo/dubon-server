import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail, sendWelcomeEmail } from '../utils/emailUtils.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getUserProfile = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.id, {
      attributes: [
        'id', 
        'name', 
        'email', 
        'avatar',
        'phone',
        'role'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Construire l'URL complète pour l'avatar
    const avatarUrl = user.avatar 
      ? `${process.env.BASE_URL || 'http://localhost:5000'}${user.avatar}`
      : null;

    // Préférences par défaut
    const preferences = {
      language: 'fr',
      currency: 'XOF',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      newsletter: true
    };

    res.json({ 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl,
        phoneNumber: user.phone || '',
        role: user.role,
        preferences
      }
    });

  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la récupération du profil",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phoneNumber } = req.body;
    let profilePhotoUrl = null;

    if (req.file) {
      // Vérifier si le dossier existe
      const uploadDir = path.join(__dirname, '..', 'uploads', 'photos');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Supprimer l'ancienne photo
      const user = await models.User.findByPk(userId);
      if (user.avatar) {
        const oldPhotoPath = path.join(__dirname, '..', user.avatar);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }

      // Gérer la nouvelle photo
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const relativePath = `/uploads/photos/${fileName}`;
      const absolutePath = path.join(__dirname, '..', relativePath);

      // Déplacer le fichier
      fs.copyFileSync(req.file.path, absolutePath);
      fs.unlinkSync(req.file.path);
      profilePhotoUrl = relativePath;
    }

    // Mise à jour de l'utilisateur
    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phoneNumber && { businessPhone: phoneNumber }),
      ...(profilePhotoUrl && { avatar: profilePhotoUrl })
    };

    await models.User.update(updateData, {
      where: { id: userId }
    });

    const updatedUser = await models.User.findByPk(userId);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatar,  // Ne pas ajouter BASE_URL ici
        phoneNumber: updatedUser.businessPhone || '',
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message
    });
  }
};

// Gestion des adresses
export const getUserAddresses = async (req, res) => {
  try {
    const addresses = await models.Address.findAll({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addUserAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, email, coordinates, ...addressData } = req.body;

    // Vérifier le nombre d'adresses
    const addressCount = await models.Address.count({ where: { userId } });
    if (addressCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "Nombre maximum d'adresses atteint (5)"
      });
    }

    // Vérifier si une adresse similaire existe déjà
    const existingAddress = await models.Address.findOne({
      where: {
        userId,
        address1: addressData.address1,
        city: addressData.city,
        postalCode: addressData.postalCode,
        country: addressData.country
      }
    });

    let address;
    if (existingAddress) {
      // Mettre à jour l'adresse existante
      address = await existingAddress.update({
        ...addressData,
        phone,
        email,
        coordinates: coordinates || null
      });
    } else {
      // Créer une nouvelle adresse
      address = await models.Address.create({
        ...addressData,
        userId,
        phone,
        email,
        coordinates: coordinates || null
      });
    }

    // Mettre à jour le numéro de téléphone de l'utilisateur si non défini
    const user = await models.User.findByPk(userId);
    if (!user.phone) {
      await user.update({ phone });
    }

    res.status(201).json({
      success: true,
      message: existingAddress ? "Adresse mise à jour avec succès" : "Adresse ajoutée avec succès",
      data: address
    });

  } catch (error) {
    console.error('Erreur ajout adresse:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de l'adresse",
      error: error.message
    });
  }
};

export const updateUserAddress = async (req, res) => {
  try {
    await models.Address.update(req.body, {
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true, message: 'Adresse mise à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUserAddress = async (req, res) => {
  try {
    await models.Address.destroy({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true, message: 'Adresse supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des commandes
export const getUserOrders = async (req, res) => {
  try {
    const orders = await models.Order.findAll({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const order = await models.Order.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion des favoris
export const getFavorites = async (req, res) => {
  try {
    const favorites = await models.Favorite.findAll({
      where: { userId: req.user.id }
    });
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    const [favorite, created] = await models.Favorite.findOrCreate({
      where: { userId: req.user.id, productId }
    });
    if (!created) await favorite.destroy();
    res.json({ success: true, added: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Autres fonctions nécessaires...
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await models.User.findByPk(req.user.id);

    // Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    // Hasher et mettre à jour le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({
      success: true,
      message: "Mot de passe mis à jour avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du mot de passe"
    });
  }
};

export const forgotPassword = async (req, res) => {
  // Implémentation
};

export const resetPassword = async (req, res) => {
  // Implémentation
};

export const verifyEmail = async (req, res) => {
  // Implémentation
};

export const resendVerificationEmail = async (req, res) => {
  // Implémentation
};

export const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const newPreferences = req.body;

    // Get current user
    const user = await models.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Get current preferences
    const currentPreferences = {
      language: 'fr',
      currency: 'XOF',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      newsletter: true,
      ...user.preferences
    };

    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...newPreferences
    };

    // Save to user model
    await user.update({
      preferences: updatedPreferences
    });

    res.json({
      success: true,
      message: "Préférences mises à jour avec succès",
      data: updatedPreferences
    });
  } catch (error) {
    console.error('Erreur updateUserPreferences:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des préférences"
    });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: activities } = await models.UserActivity.findAndCountAll({
      where: { userId: req.user.id },
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      activities,
      pagination: {
        total: count,
        page,
        pages: totalPages
      }
    });
  } catch (error) {
    console.error('Erreur getUserActivity:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des activités"
    });
  }
};

export const getUserStats = async (req, res) => {
  // Implémentation
};

export const getUserNotifications = async (req, res) => {
  // Implémentation
};

export const markNotificationsAsRead = async (req, res) => {
  // Implémentation
};

export const updateNotificationSettings = async (req, res) => {
  // Implémentation
};

// Routes admin
export const getAllUsers = async (req, res) => {
  // Implémentation
};

export const getUserById = async (req, res) => {
  // Implémentation
};

export const updateUserStatus = async (req, res) => {
  // Implémentation
};

export const deleteUser = async (req, res) => {
  // Implémentation
};

// Ajouter une fonction pour rafraîchir le token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token manquant' });
    }

    const user = await models.User.findOne({
      where: { refreshToken }
    });

    if (!user) {
      return res.status(403).json({ success: false, message: 'Refresh token invalide' });
    }

    // Vérifier le refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Refresh token invalide' });
      }

      // Générer un nouveau access token
      const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        accessToken: newAccessToken
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Récupération du dashboard pour userId:', userId);

    const [deliveredOrders, paidOrders, pendingOrders] = await Promise.all([
      models.Order.findAll({
        where: { 
          userId,
          status: 'delivered'
        },
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      models.Order.findAll({
        where: { 
          userId,
          status: 'delivering',
          paymentStatus: 'completed'
        },
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      models.Order.findAll({
        where: { 
          userId,
          paymentStatus: 'pending'
        },
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    console.log('Commandes livrées:', deliveredOrders.length);
    console.log('Commandes payées:', paidOrders.length);
    console.log('Commandes en attente:', pendingOrders.length);

    // Formater les données avec gestion d'erreur pour le parsing JSON
    const dashboard = {
      deliveredOrders: deliveredOrders.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-8),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.title || 'Produit non disponible',
          quantity: item.quantity,
          price: item.finalPrice,
          image: item.images && item.images.length > 0 ? 
            (Array.isArray(item.images) ? 
              (item.images[0]?.url || item.images[0]) 
              : (item.images.url || item.images)) 
            : null
        }))
      })),
      paidOrders: paidOrders.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-8),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.title || 'Produit non disponible',
          quantity: item.quantity,
          price: item.finalPrice,
          image: item.images && item.images.length > 0 ? 
            (Array.isArray(item.images) ? 
              (item.images[0]?.url || item.images[0]) 
              : (item.images.url || item.images)) 
            : null
        }))
      })),
      pendingOrders: pendingOrders.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-8),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.title || 'Produit non disponible',
          quantity: item.quantity,
          price: item.finalPrice,
          image: item.images && item.images.length > 0 ? 
            (Array.isArray(item.images) ? 
              (item.images[0]?.url || item.images[0]) 
              : (item.images.url || item.images)) 
            : null
        }))
      })),
      favoriteProducts: [],
      notifications: [],
      recentReviews: [],
      recentActivities: [],
      stats: {
        totalOrders: deliveredOrders.length + paidOrders.length + pendingOrders.length,
        favoriteCount: 0,
        addressCount: 0,
        reviewCount: 0,
        unreadNotifications: 0
      }
    };

    console.log('Dashboard formaté avec succès');

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données du dashboard",
      error: error.message
    });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await models.Review.findAll({
      where: { userId: req.user.id },
      include: [{
        model: models.Product,
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Vérifier si des avis existent
    if (!reviews || reviews.length === 0) {
      return res.json({
        success: true,
        reviews: []
      });
    }

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      productName: review.Product ? review.Product.name : 'Produit non disponible',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    }));

    res.json({
      success: true,
      reviews: formattedReviews
    });
  } catch (error) {
    console.error('Erreur getUserReviews:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des avis",
      reviews: []
    });
  }
};