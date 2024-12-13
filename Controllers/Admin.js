import User from'../models/User.js';
import Order from'../models/Order.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Seller from '../models/Seller.js';
import nodemailer from 'nodemailer';
import Product from '../models/Product.js';

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

// Toutes les fonctions sans export
const userInfo = async (req, res) => {
  console.log('user:', userInfo);
   try {
     const user = await User.findById(req.params.id);
     
     if (!user) {
       return res.status(404).json({ message: "Utilisateur non trouvé" });
     }
     res.json(user);
   } catch (error) {
     console.error("Erreur lors de la récupération de l'utilisateur:", error);
     res.status(500).json({ message: "Erreur interne du serveur" });
   }
 };

const getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
};

const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.remove();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email');
  res.json(orders);
};

const deleteOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    await order.remove();
    res.json({ message: 'Order removed' });
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

const getSellerRequests = async (req, res) => {
  console.log("\n=== DÉBUT GET SELLER REQUESTS ===");
  try {
    console.log("Recherche des demandes en attente...");
    
    // Vérifier l'authentification
    console.log("User:", req.user);
    
    const requests = await Seller.find({ status: 'pending' })
      .populate('userId', 'name email')
      .select('-__v')
      .lean();
    
    console.log('Nombre de demandes trouvées:', requests.length);
    console.log('Demandes:', JSON.stringify(requests, null, 2));
    
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Erreur dans getSellerRequests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching seller requests',
      error: error.message 
    });
  }
  console.log("=== FIN GET SELLER REQUESTS ===\n");
};

const approveSellerRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const seller = await Seller.findById(id).populate('userId');
    if (!seller) {
      return res.status(404).json({ message: 'Seller request not found' });
    }

    // Mettre à jour le statut du vendeur
    seller.status = 'approved';
    seller.validation.status = 'approved';
    await seller.save();

    // Mettre à jour le rôle de l'utilisateur
    await User.findByIdAndUpdate(seller.userId._id, { role: 'seller' });

    try {
      // Tentative d'envoi d'email
      const mailOptions = {
        from: process.env.EMAIL,
        to: seller.userId.email,
        subject: 'Votre demande de vendeur a été approuvée',
        html: `
          <h1>Félicitations !</h1>
          <p>Votre demande pour devenir vendeur sur notre plateforme a été approuvée.</p>
          <p>Vous pouvez maintenant accéder à votre tableau de bord vendeur.</p>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      // Continuer malgré l'erreur d'email
    }

    res.status(200).json({ 
      success: true,
      message: 'Seller request approved successfully' 
    });
  } catch (error) {
    console.error('Error approving seller request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error approving seller request',
      error: error.message 
    });
  }
};

const rejectSellerRequest = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body; // Raison du rejet

  try {
    const seller = await Seller.findById(id).populate('userId');
    if (!seller) {
      return res.status(404).json({ message: 'Seller request not found' });
    }

    // Mettre à jour le statut
    seller.status = 'rejected';
    seller.validation.status = 'rejected';
    seller.validation.message = reason;
    await seller.save();

    // Envoyer un email de notification
    const mailOptions = {
      from: process.env.EMAIL,
      to: seller.userId.email,
      subject: 'Mise à jour de votre demande de vendeur',
      html: `
        <h1>Statut de votre demande</h1>
        <p>Malheureusement, votre demande pour devenir vendeur n'a pas été approuvée.</p>
        <p>Raison : ${reason}</p>
        <p>Vous pouvez nous contacter pour plus d'informations.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true,
      message: 'Seller request rejected and user notified' 
    });
  } catch (error) {
    console.error('Error rejecting seller request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email });
    console.log('Admin trouvé:', admin);
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    if (admin.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized as admin' });
    }

    const isMatch = await admin.isPasswordMatched(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
console.log('token:', token);

    res.status(200).json({ 
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const registerAdmin = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    // Laisser le modèle gérer le hashage
    const newAdmin = new User({
      email,
      password, // Password brut - sera hashé par le pre-save hook
      name,
      role: 'admin'
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getPendingSellers = async (req, res) => {
  try {
    const pendingSellers = await Seller.find({ validationStatus: 'pending' });
    res.status(200).json(pendingSellers);
  } catch (error) {
    console.error('Error fetching pending sellers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'daily';
    
    // Statistiques de base avec distinction par rôle
    const totalUsers = await User.countDocuments();
    const sellers = await User.countDocuments({ role: 'seller' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    const pendingRequests = await Seller.countDocuments({ status: 'pending' });
    const totalOrders = await Order.countDocuments();

    // Calcul des revenus
    const orders = await Order.find();
    const totalRevenue = orders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    // Données pour le graphique selon le timeframe
    let recentOrders;
    const startDate = new Date();

    switch (timeframe) {
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 12);
        recentOrders = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
              amount: { $sum: "$totalAmount" }
            }
          },
          { $sort: { "_id": 1 } }
        ]);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        recentOrders = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              amount: { $sum: "$totalAmount" }
            }
          },
          { $sort: { "_id": 1 } }
        ]);
        break;
      default: // daily
        startDate.setDate(startDate.getDate() - 30);
        recentOrders = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              amount: { $sum: "$totalAmount" }
            }
          },
          { $sort: { "_id": 1 } }
        ]);
    }

    // Top vendeurs avec leurs statistiques
    const topSellers = await Order.aggregate([
      {
        $group: {
          _id: "$sellerId",
          sales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { sales: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          regular: regularUsers,
          sellers: sellers
        },
        pendingRequests,
        totalOrders,
        revenue: {
          total: totalRevenue,
          weekly: recentOrders.slice(-7).reduce((acc, o) => acc + (o.amount || 0), 0),
          monthly: recentOrders.slice(-30).reduce((acc, o) => acc + (o.amount || 0), 0)
        },
        recentOrders: recentOrders.map(o => ({
          date: o._id,
          amount: o.amount || 0
        })),
        topSellers: topSellers.map(s => ({
          name: s.sellerInfo[0]?.name || 'Unknown',
          sales: s.sales,
          revenue: s.totalRevenue
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

export const approveSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          status: 'approved',
          'validation.status': 'approved',
          'validation.approvedAt': new Date(),
          'validation.approvedBy': req.user._id
        }
      },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Vendeur non trouvé'
      });
    }

    // Mettre à jour le rôle de l'utilisateur
    await User.findByIdAndUpdate(seller.userId, {
      $set: { role: 'seller' }
    });

    res.status(200).json({
      success: true,
      message: 'Demande de vendeur approuvée',
      data: seller
    });
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'approbation de la demande'
    });
  }
};

// Un seul export groupé à la fin
export {
  userInfo,
  getUsers,
  deleteUser,
  deleteOrder,
  getOrders,
  getSellerRequests,
  approveSellerRequest,
  rejectSellerRequest,
  adminLogin,
  registerAdmin,
  getPendingSellers,
  verifyAdmin,
  getDashboardStats
};