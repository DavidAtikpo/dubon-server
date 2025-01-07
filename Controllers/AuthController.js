import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

const { User } = models;

// Attributs de base pour tous les utilisateurs
const baseAttributes = ['id', 'name', 'email', 'role', 'avatar', 'status'];

// Attributs supplémentaires pour les vendeurs
// const sellerAttributes = [
  
//   'businessName',
//   'storeId',
//   'subscriptionStatus',
//   'subscriptionEndsAt',
//   'trialEndsAt',
//   'businessAddress',
//   'businessPhone',
//   'businessEmail'
// ];

// Vérifier l'utilisateur connecté
export const me = async (req, res) => {
  try {
    // Sélectionner les attributs en fonction du rôle
    const attributes = [...baseAttributes];
    if (req.user.role === 'seller') {
      attributes.push(...sellerAttributes);
    }

    const user = await User.findByPk(req.user.id, { attributes });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des informations"
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      attributes: [...baseAttributes, 'password'] 
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé ou suspendu"
      });
    }

    // Si c'est un vendeur, récupérer les informations supplémentaires
    // if (user.role === 'seller') {
    //   const sellerInfo = await User.findByPk(user.id, {
    //     attributes: sellerAttributes
    //   });
    //   Object.assign(user, sellerInfo.toJSON());
    // }

    // Générer les tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Mettre à jour la dernière connexion et le refresh token
    await user.update({ 
      lastLogin: new Date(),
      refreshToken 
    });

    const userData = user.toJSON();
    delete userData.password;
    delete userData.refreshToken;

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: userData
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion"
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    // Ici vous pouvez ajouter la logique pour blacklister le token si nécessaire
    res.json({
      success: true,
      message: "Déconnexion réussie"
    });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion"
    });
  }
}; 