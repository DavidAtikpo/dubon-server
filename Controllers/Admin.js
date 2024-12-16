import { models } from '../models/index.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/emailSender.js';
import crypto from 'crypto';
import { Op } from 'sequelize';

const { User, Order, Seller } = models;

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

    // Créer l'administrateur
    const admin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      email_verified: false
    });

    // Envoyer un email de confirmation
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

      await admin.update({
        email_verification_token: hashedToken,
        email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
      
      await sendEmail({
        to: admin.email,
        subject: 'Vérification de votre compte administrateur - Dubon Service',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1D4ED8;">Bienvenue sur Dubon Service !</h1>
            <p>Votre compte administrateur a été créé. Pour l'activer, veuillez cliquer sur le lien ci-dessous :</p>
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
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666;">Cordialement,<br>L'équipe Dubon Service</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: "Compte administrateur créé avec succès. Veuillez vérifier votre email.",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Erreur lors de l'inscription admin:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur lors de la création du compte administrateur" 
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation de l'email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis"
      });
    }

    // Trouver l'administrateur
    const admin = await User.findOne({
      where: {
        email: email.toLowerCase().trim(),
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Email non reconnu ou vous n'avez pas les droits administrateur"
      });
    }

    // Générer un token de connexion unique
    const loginToken = crypto.randomBytes(32).toString('hex');
    const hashedLoginToken = crypto
      .createHash('sha256')
      .update(loginToken)
      .digest('hex');

    // Mettre à jour l'admin avec le nouveau token
    await admin.update({
      email_verification_token: hashedLoginToken,
      email_verification_expires: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    });

    // Créer le lien de connexion
    const loginUrl = `${process.env.FRONTEND_URL}/admin/verify-login/${loginToken}`;

    // Envoyer l'email de connexion
    await sendEmail({
      to: admin.email,
      subject: 'Connexion à votre compte administrateur - Dubon Service',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1D4ED8;">Connexion Administrateur</h1>
          <p>Une demande de connexion a été effectuée pour votre compte administrateur.</p>
          <p>Cliquez sur le lien ci-dessous pour vous connecter :</p>
          <a href="${loginUrl}" 
             style="background-color: #1D4ED8; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    display: inline-block; 
                    margin: 20px 0;">
            Se connecter
          </a>
          <p style="color: #666;">Ce lien expirera dans 30 minutes.</p>
          <p style="color: #666;">Si vous n'avez pas demandé cette connexion, ignorez cet email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666;">Cordialement,<br>L'équipe Dubon Service</p>
        </div>
      `
    });

    res.status(200).json({
      success: true,
      message: "Un email de connexion vous a été envoyé. Veuillez vérifier votre boîte de réception."
    });

  } catch (error) {
    console.error("Erreur lors de la tentative de connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de l'email de connexion"
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Implémentation...
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est un admin
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    const users = await User.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'profile_photo_url',
        'is_blocked',
        'email_verified',
        'created_at',
        'updated_at',
        'role'
      ],
      order: [['created_at', 'DESC']]
    });

    const formattedUsers = users.map(user => ({
      _id: user.id,
      name: user.name,
      displayName: user.name,
      email: user.email,
      avatar: user.profile_photo_url,
      status: user.is_blocked ? 'Bloqué' : (user.email_verified ? 'Vérifié' : 'Non vérifié'),
      lastConnection: user.updated_at,
      role: user.role,
      mobile: null,
      region: null,
      zipCode: null
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    await user.update({ isBlocked: true });
    res.status(200).json({ success: true, message: 'Utilisateur bloqué' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    await user.update({ isBlocked: false });
    res.status(200).json({ success: true, message: 'Utilisateur débloqué' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.findAll({
      include: [{ model: User, as: 'sellerUser' }]
    });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id, {
      include: [{ model: User, as: 'sellerUser' }]
    });
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }
    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }
    await seller.update({ status: 'approved' });
    res.status(200).json({ success: true, message: 'Vendeur approuvé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectSeller = async (req, res) => {
  try {
    const seller = await Seller.findByPk(req.params.id);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }
    await seller.update({ status: 'rejected' });
    res.status(200).json({ success: true, message: 'Vendeur rejeté' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Implémentation...
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRevenue = async (req, res) => {
  try {
    // Implémentation...
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Nouvelle fonction pour vérifier le token de connexion
export const verifyLoginToken = async (req, res) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const admin = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        role: 'admin',
        email_verification_expires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Le lien de connexion est invalide ou a expiré"
      });
    }

    await admin.update({
      email_verification_token: null,
      email_verification_expires: null
    });

    // Renommé pour éviter le conflit
    const jwtToken = generateToken(admin.id);

    res.status(200).json({
      success: true,
      token: jwtToken,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du token"
    });
  }
};

export const verifyLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token manquant"
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const admin = await User.findOne({
      where: {
        email_verification_token: hashedToken,
        email_verification_expires: {
          [Op.gt]: new Date()
        },
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Lien invalide ou expiré"
      });
    }

    // Générer le JWT token
    const jwtToken = generateToken(admin.id);

    // Effacer le token de vérification
    await admin.update({
      email_verification_token: null,
      email_verification_expires: null
    });

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification"
    });
  }
};

export default {
  register,
  login,
  verifyLoginToken,
  logout,
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  getAllSellers,
  getSellerById,
  approveSeller,
  rejectSeller,
  getDashboardStats,
  getRecentOrders,
  getRevenue
};