import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/emailUtils.js';

// Authentification
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const user = await models.User.create({
      email,
      password: await bcrypt.hash(password, 10),
      name
    });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await models.User.findOne({ where: { email } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    // Logique de déconnexion
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
    await models.User.update(req.body, {
      where: { id: req.user.id }
    });
    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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