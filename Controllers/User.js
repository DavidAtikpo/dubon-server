import { models } from '../models/index.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/emailSender.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { sequelize } from '../config/dbConfig.js';

const { User } = models;

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Tous les champs sont obligatoires" 
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Cet email est déjà utilisé" 
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Générer le token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      email_verified: false,
      email_verification_token: hashedToken,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
    });

    // Générer le token JWT
    const token = generateToken(user.id);

    // Préparer l'URL de vérification
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    // Envoyer l'email de vérification
    try {
      console.log('Préparation de l\'envoi de l\'email...');
      console.log('URL de vérification:', verificationUrl);
      
      await sendEmail({
        to: user.email,
        subject: 'Vérification de votre compte - Dubon Service',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1D4ED8;">Bienvenue sur Dubon Service !</h1>
            <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
            <a href="${verificationUrl}" 
               style="background-color: #1D4ED8; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block; 
                      margin: 20px 0;">
              Vérifier mon email
            </a>
            <p style="color: #666;">Ce lien expirera dans 24 heures.</p>
            <p style="color: #666;">Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666;">Cordialement,<br>L'équipe Dubon Service</p>
          </div>
        `
      });

      console.log('Email envoyé avec succès à:', user.email);

      res.status(201).json({
        success: true,
        message: "Inscription réussie ! Veuillez vérifier votre email.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          email_verified: false
        }
      });

    } catch (emailError) {
      console.error('Détails de l\'erreur d\'envoi d\'email:', {
        error: emailError.message,
        stack: emailError.stack,
        code: emailError.code
      });
      
      // L'utilisateur est créé mais l'email n'a pas été envoyé
      res.status(201).json({
        success: true,
        message: "Inscription réussie mais l'envoi de l'email a échoué. Contactez le support.",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          email_verified: false
        }
      });
    }

  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de l'inscription",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ 
      where: { email: email.toLowerCase().trim() } 
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    // Comparer les mots de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect"
      });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Erreur de connexion:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la connexion"
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { userId } = req;

    // Supprimer le refresh token
    await User.update(
      { refresh_token: null },
      { where: { id: userId } }
    );

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie"
    });

  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
      error: error.message
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("\n=== VÉRIFICATION EMAIL ===");
    console.log("Token reçu:", token);

    // Hasher le token reçu
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("Token hashé:", hashedToken);

    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        email_verified: false,
        email_verification_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    console.log("Utilisateur trouvé:", user ? "Oui" : "Non");

    if (!user) {
      console.log("Token invalide ou expiré");
      return res.status(400).json({
        success: false,
        message: "Le lien de vérification est invalide ou a expiré"
      });
    }

    // Mettre à jour l'utilisateur
    await user.update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    console.log("Email vérifié avec succès");

    res.status(200).json({
      success: true,
      message: "Email vérifié avec succès"
    });

  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la vérification",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    // ... code de mot de passe oublié
  } catch (error) {
    // ... gestion des erreurs
  }
};

export const resetPassword = async (req, res) => {
  try {
    // ... code de réinitialisation de mot de passe
  } catch (error) {
    // ... gestion des erreurs
  }
};

export const updatePassword = async (req, res) => {
  try {
    // ... code de mise à jour de mot de passe
  } catch (error) {
    // ... gestion des erreurs
  }
};

export const userInfo = async (req, res) => {
  try {
    // ... code d'info utilisateur
  } catch (error) {
    // ... gestion des erreurs
  }
};

// Ajouter aussi la fonction pour renvoyer un email de vérification
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("\n=== RENVOI EMAIL DE VÉRIFICATION ===");
    console.log("Email:", email);

    const user = await User.findOne({
      where: { 
        email: email.toLowerCase().trim(),
        email_verified: false
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Utilisateur non trouvé ou déjà vérifié"
      });
    }

    // Générer un nouveau token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Mettre à jour l'utilisateur
    await user.update({
      email_verification_token: hashedToken,
      email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Envoyer l'email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Nouveau lien de vérification - Dubon Service',
      html: `
        <h1>Nouveau lien de vérification</h1>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
        <a href="${verificationUrl}">Vérifier mon email</a>
        <p>Ce lien expirera dans 24 heures.</p>
      `
    });

    res.status(200).json({
      success: true,
      message: "Nouvel email de vérification envoyé"
    });

  } catch (error) {
    console.error("Erreur lors du renvoi:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du nouvel email",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Grouper tous les exports
const userController = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  userInfo,
  resendVerificationEmail
};

export default userController;