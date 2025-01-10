import { models } from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { sendWelcomeEmail } from '../utils/emailUtils.js';
import crypto from 'crypto';
import { sendEmail } from '../utils/emailUtils.js';

const { User } = models;

// Attributs de base pour tous les utilisateurs
const baseAttributes = ['id', 'name', 'email', 'role', 'avatar', 'status'];



// Vérifier l'utilisateur connecté
export const me = async (req, res) => {
  try {
    // L'utilisateur est déjà vérifié par le middleware
    const userData = req.user;
    console.log('Début /me - userData:', userData);

    if (!userData) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié"
      });
    }

    // Si c'est un vendeur, récupérer les informations supplémentaires
    if (userData.role === 'seller') {
      console.log('Récupération du profil vendeur...');
      const sellerProfile = await models.SellerProfile.findOne({
        where: { userId: userData.id }
      });

      if (sellerProfile) {
        userData.storeId = sellerProfile.id;
        console.log('StoreId ajouté:', sellerProfile.id);
      }
    }

    console.log('Envoi de la réponse:', { success: true, user: userData });
    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Erreur /me:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des informations"
    });
  }
};

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

    // Créer l'utilisateur
    const user = await models.User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active'
    });

    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Erreur envoi email de bienvenue:', emailError);
    }

    res.status(201).json({
      success: true,
      message: "Compte créé avec succès"
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du compte"
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
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

    // Préparer les données utilisateur à renvoyer
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status
    };

    // Générer les tokens avec seulement les données nécessaires
    const accessToken = jwt.sign(
      { id: user.id },  // Inclure seulement l'ID dans le token
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

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Si cette adresse existe, un email a été envoyé"
      });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

    // Sauvegarder le token dans la base de données
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpiry: resetTokenExpiry
    });

    // Envoyer l'email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl
      }
    });

    res.json({
      success: true,
      message: "Si cette adresse existe, un email a été envoyé"
    });

  } catch (error) {
    console.error('Erreur mot de passe oublié:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de réinitialisation"
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Trouver l'utilisateur avec le token valide
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: {
          [Op.gt]: new Date() // Token non expiré
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Le lien de réinitialisation est invalide ou a expiré"
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mettre à jour le mot de passe et réinitialiser le token
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null
    });

    res.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès"
    });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe"
    });
  }
}; 