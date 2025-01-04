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

// Authentification
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le nouvel utilisateur
    const user = await models.User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active'
    });

    // Retirer le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    
    // Gérer spécifiquement l'erreur d'unicité
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé"
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  }
};

// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await models.User.findOne({ 
//       where: { email },
//       attributes: ['id', 'email', 'password', 'name', 'profilePhotoUrl', 'role']
//     });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Identifiants invalides' 
//       });
//     }

//     // Générer access token et refresh token
//     const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

//     // Sauvegarder le refresh token dans la base de données
//     await models.User.update(
//       { refreshToken: refreshToken },
//       { where: { id: user.id } }
//     );

//     // Envoyer les deux tokens
//     res.json({ 
//       success: true, 
//       accessToken,
//       refreshToken,
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//         profilePhotoUrl: user.profilePhotoUrl,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

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
      attributes: [
        'id', 
        'name', 
        'email', 
        'avatar',
        'businessPhone',
        'role'
      ]
    });

    // Construire l'URL complète
    const avatarUrl = user.avatar 
      ? `${process.env.BASE_URL}${user.avatar}`
      : null;

    res.json({ 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl,
        phoneNumber: user.businessPhone || '',
        preferences: {
          language: 'fr',
          currency: 'FCFA',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          newsletter: true
        }
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
  console.log(req.body);
  try {
    const address = await models.Address.create({
      ...req.body,
      userId: req.user.id
    });
    console.log(address);
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
    const preferences = req.body;

    await models.UserPreference.upsert({
      userId,
      ...preferences
    });

    res.json({
      success: true,
      message: "Préférences mises à jour avec succès",
      data: preferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des préférences"
    });
  }
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

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders, favorites, addresses, notifications, recentActivity, reviews] = await Promise.all([
      // Dernières commandes avec leurs items
      models.Order.findAll({
        where: { userId },
        attributes: [
          'id',
          'status',
          'total',
          'items',
          'createdAt'
        ],
        limit: 5,
        order: [['createdAt', 'DESC']]
      }),

      // Produits favoris
      models.Favorite.findAll({
        where: { userId },
        include: [{
          model: models.Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'images']
        }],
        limit: 5
      }),

      // Adresses
      models.Address.findAll({
        where: { userId }
      }),

      // Notifications non lues
      models.Notification.findAll({
        where: { userId, isRead: false },
        limit: 5,
        order: [['createdAt', 'DESC']]
      }),

      // Activité récente
      models.UserActivity.findAll({
        where: { userId },
        limit: 10,
        order: [['createdAt', 'DESC']]
      }),

      // Reviews
      models.Review.findAll({
        where: { userId },
        limit: 5,
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Formater les données selon l'interface du frontend
    const dashboard = {
      recentOrders: orders.map(order => ({
        id: order.id,
        orderNumber: order.id.slice(-8),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items ? JSON.parse(order.items) : []
      })),

      recentReviews: reviews.map(review => ({
        id: review.id,
        productName: review.productName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),

      recentActivities: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.action,
        description: activity.details,
        createdAt: activity.createdAt
      })),

      favoriteProducts: favorites.map(fav => ({
        id: fav.product.id,
        name: fav.product.name,
        price: fav.product.price,
        imageUrl: fav.product.images ? fav.product.images[0] : null
      })),

      stats: {
        totalOrders: orders.length,
        favoriteCount: favorites.length,
        addressCount: addresses.length,
        reviewCount: reviews.length
      }
    };

    res.json({
      success: true,
      dashboard
    });

  } catch (error) {
    console.error('Erreur getDashboard:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des données du dashboard"
    });
  }
};