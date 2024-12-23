import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail, sendWelcomeEmail } from '../utils/emailUtils.js';
import cloudinary from '../config/cloudinary.js';

// Authentification
export const register = async (req, res) => {
  try {
    const { email, password, name, address = null } = req.body;
    
    const userData = {
      email,
      password: await bcrypt.hash(password, 10),
      name,
      address: address || null
    };

    const user = await models.User.create(userData);
    
    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Erreur envoi email de bienvenue:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    res.status(201).json({ 
      success: true, 
      message: 'Inscription réussie. Un email de bienvenue vous a été envoyé.'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.errors?.map(e => e.message)
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await models.User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'password', 'name', 'profilePhotoUrl', 'role']
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false, 
        message: 'Identifiants invalides' 
      });
    }

    // Générer access token et refresh token
    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // Sauvegarder le refresh token dans la base de données
    await models.User.update(
      { refreshToken: refreshToken },
      { where: { id: user.id } }
    );

    // Envoyer les deux tokens
    res.json({ 
      success: true, 
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePhotoUrl: user.profilePhotoUrl,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Récupérer l'ID de l'utilisateur depuis le token
    const userId = req.user.id;

    // Supprimer le refresh token de la base de données
    await models.User.update(
      { refreshToken: null },
      { where: { id: userId } }
    );

    res.json({ success: true, message: 'Déconnexion réussie' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Gestion du profil
export const getUserProfile = async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.id, {
      include: ['profile']
    });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, bio, phoneNumber } = req.body;
    let profilePhotoUrl = null;

    // Si une photo est uploadée
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'profile_photos',
        width: 200,
        crop: "fill"
      });
      profilePhotoUrl = result.secure_url;
    }

    // Mise à jour du profil
    const updateData = {
      name,
      profile: {
        bio,
        phoneNumber,
        ...(profilePhotoUrl && { profilePhotoUrl })
      }
    };

    await models.User.update(updateData, {
      where: { id: userId }
    });

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await models.User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'profilePhotoUrl']
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
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
    const address = await models.Address.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
  // Implémentation
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
  // Implémentation
};

export const getUserActivity = async (req, res) => {
  // Implémentation
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
      const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({
        success: true,
        accessToken: newAccessToken
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};