import { models } from '../models/index.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/emailSender.js';
import crypto from 'crypto';
import { Op } from 'sequelize';
import sequelize from 'sequelize';

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

    // Générer directement le JWT token
    const token = generateToken(admin.id);

    // Retourner directement la réponse avec le token
    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Erreur lors de la tentative de connexion:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion"
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    // Récupérer tous les utilisateurs avec les informations nécessaires
    const users = await User.findAll({
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'profile_photo_url',
        'is_blocked',
        'email_verified',
        'created_at',
        'updated_at',
        'mobile',
        'region',
        'zip_code'
      ],
      order: [['created_at', 'DESC']]
    });

    // Formater les données pour correspondre à l'interface du frontend
    const formattedUsers = users.map(user => ({
      _id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      region: user.region || null,
      zipCode: user.zip_code || null,
      avatar: user.profile_photo_url,
      status: user.is_blocked 
        ? 'Bloqué' 
        : (user.email_verified ? 'Vérifié' : 'Non vérifié'),
      lastConnection: user.updated_at,
      role: user.role
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
    // Vérifier si l'utilisateur est un admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé"
      });
    }

    const userId = req.params.id;
    const user = await User.findOne({
      where: { id: userId },
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'profile_photo_url',
        'mobile',
        'region',
        'zip_code',
        'is_blocked',
        'email_verified',
        'created_at',
        'updated_at'
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Formater les données pour le frontend
    const formattedUser = {
      _id: user.id,
      displayName: user.name,
      name: user.name,
      email: user.email,
      mobile: user.mobile || null,
      region: user.region || null,
      zipCode: user.zip_code || null,
      avatar: user.profile_photo_url,
      status: user.is_blocked 
        ? 'Bloqué' 
        : (user.email_verified ? 'Vérifié' : 'Non vérifié'),
      lastConnection: user.updated_at,
      role: user.role,
      createdAt: user.created_at
    };

    res.status(200).json({
      success: true,
      data: formattedUser
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des détails utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails utilisateur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.log('Récupération des stats du dashboard...');
    console.log('User:', req.user);

    // Récupérer les statistiques des utilisateurs
    const usersStats = await User.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('*')), 'total'],
        [
          sequelize.fn('COUNT', 
            sequelize.literal("CASE WHEN role = 'user' THEN 1 END")
          ), 
          'regular'
        ],
        [
          sequelize.fn('COUNT', 
            sequelize.literal("CASE WHEN role = 'seller' THEN 1 END")
          ), 
          'sellers'
        ]
      ],
      raw: true
    });

    // Récupérer le nombre de demandes en attente (vendeurs en attente)
    const pendingRequests = await Seller.count({
      where: {
        status: 'pending'
      }
    });

    // Récupérer les statistiques des commandes
    const ordersStats = await Order.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('*')), 'total'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        [
          sequelize.fn('SUM', 
            sequelize.literal("CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_amount ELSE 0 END")
          ),
          'weeklyRevenue'
        ],
        [
          sequelize.fn('SUM', 
            sequelize.literal("CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_amount ELSE 0 END")
          ),
          'monthlyRevenue'
        ]
      ],
      raw: true
    });

    const stats = {
      users: {
        total: parseInt(usersStats[0].total) || 0,
        regular: parseInt(usersStats[0].regular) || 0,
        sellers: parseInt(usersStats[0].sellers) || 0
      },
      pendingRequests: pendingRequests || 0,
      totalOrders: parseInt(ordersStats[0].total) || 0,
      revenue: {
        total: parseFloat(ordersStats[0].totalRevenue) || 0,
        weekly: parseFloat(ordersStats[0].weeklyRevenue) || 0,
        monthly: parseFloat(ordersStats[0].monthlyRevenue) || 0
      }
    };

    console.log('Stats récupérées:', stats);
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Erreur détaillée:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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