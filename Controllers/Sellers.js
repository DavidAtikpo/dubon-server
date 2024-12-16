import { models } from '../models/index.js';
const { Product, User, Seller } = models;

// Fonction utilitaire pour uploader des fichiers
const uploadFile = async (file, fileType) => {
  try {
    console.log("Début uploadFile pour:", fileType);
    console.log("File reçu:", file);

    if (!file) {
      throw new Error("Fichier manquant");
    }

    // Avec multer, le fichier est déjà déplacé
    // Nous n'avons qu'à retourner le chemin
    return file.path.replace(/\\/g, '/'); // Convertir les backslashes en forward slashes pour les URLs

  } catch (error) {
    console.error("Erreur détaillée lors de l'upload :", error);
    throw new Error(`Échec de l'upload du fichier: ${error.message}`);
  }
};

// Toutes les fonctions exportées
export const registerSeller = async (req, res) => {
  try {
    console.log("Début de registerSeller");
    console.log("Files reçus:", req.files);
    console.log("Body reçu:", req.body);
    console.log("User ID:", req.user._id);

    const formData = JSON.parse(req.body.data);
    
    // Nettoyer les données des produits
    if (formData.businessInfo?.products) {
      formData.businessInfo.products = formData.businessInfo.products.map(product => ({
        ...product,
        images: []
      }));
    }

    // Gérer les uploads de fichiers
    const fileData = {
      documents: {
        idCard: req.files?.idCard?.[0]?.path,
        proofOfAddress: req.files?.proofOfAddress?.[0]?.path,
        taxCertificate: req.files?.taxCertificate?.[0]?.path,
        photos: req.files?.photos?.map(photo => photo.path) || []
      },
      contract: {
        signed: true,
        signedDocument: req.files?.signedDocument?.[0]?.path
      },
      videoVerification: {
        completed: true,
        recordingUrl: req.files?.verificationVideo?.[0]?.path
      }
    };

    const sellerData = {
      ...formData,
      ...fileData,
      userId: req.user._id,
      status: 'pending',
      updatedAt: new Date()
    };

    // Vérifier si le vendeur existe déjà
    const existingSeller = await Seller.findOne({ userId: req.user._id });

    let seller;
    if (existingSeller) {
      // Mettre à jour le vendeur existant
      seller = await Seller.findOneAndUpdate(
        { userId: req.user._id },
        sellerData,
        { new: true }
      );
      console.log("Vendeur mis à jour:", seller);
    } else {
      // Créer un nouveau vendeur
      sellerData.createdAt = new Date();
      seller = new Seller(sellerData);
      await seller.save();
      console.log("Nouveau vendeur créé:", seller);
    }

    res.status(201).json({
      success: true,
      message: existingSeller ? "Données mises à jour avec succès" : "Inscription réussie, en attente de validation",
      seller: seller
    });

  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription/mise à jour",
      error: error.message
    });
  }
};

export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user._id;
    const seller = await Seller.findOne({ userId });

    if (!seller) {
      return res.status(404).json({ 
        success: false, 
        message: "Vendeur non trouvé" 
      });
    }

    // Mettre à jour le statut du vendeur
    seller.subscription = {
      plan: 'trial',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      status: 'active'
    };

    await seller.save();

    // Mettre à jour le rôle de l'utilisateur
    await User.findByIdAndUpdate(userId, {
      $set: { role: 'seller' }
    });

    res.status(200).json({
      success: true,
      message: "Essai gratuit activé avec succès",
      data: seller
    });
  } catch (error) {
    console.error("Erreur lors de l'activation de l'essai:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'activation de l'essai"
    });
  }
};

export const checkTrialStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive && user.trialEndDate > Date.now()) {
      return res
        .status(200)
        .json({ message: "Essai gratuit actif.", trialEndDate: user.trialEndDate });
    } else {
      user.isTrialActive = false;
      user.role = "user"; // Rétablir le rôle utilisateur
      await user.save();
      return res.status(200).json({ message: "Essai gratuit expiré." });
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'essai :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const paySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.isTrialActive) {
      user.subscriptionPaid = true;
      user.isTrialActive = false;
      await user.save();
      res.status(200).json({ message: "Abonnement payé avec succès." });
    } else {
      res.status(400).json({ message: "Essai gratuit expiré ou non activé." });
    }
  } catch (error) {
    console.error("Erreur lors du paiement :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.status(200).json(sellers);
  } catch (error) {
    console.error("Erreur lors de la récupération des vendeurs :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json(seller);
  } catch (error) {
    console.error("Erreur lors de la récupération :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const blockSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json({ message: "Vendeur bloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du blocage :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const unblockSeller = async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!seller) return res.status(404).json({ message: "Vendeur non trouvé." });
    res.status(200).json({ message: "Vendeur débloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du déblocage :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

export const checkValidationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Checking status for userId:", userId);

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    console.log("User found:", user);

    // Rechercher la demande de vendeur
    const seller = await Seller.findOne({ userId })
      .select('status validation createdAt userId')
      .lean();

    console.log("Seller found:", seller);

    // Vérifier toutes les demandes de vendeur (pour le débogage)
    const allSellers = await Seller.find({}).lean();
    console.log("All sellers:", allSellers);

    if (!seller) {
      return res.status(200).json({
        success: true,
        status: 'not_found',
        message: 'Aucune demande trouvée'
      });
    }

    // Vérifier les deux champs de statut
    const isApproved = 
      seller.status === 'approved' && 
      seller.validation?.status === 'approved';

    res.status(200).json({
      success: true,
      status: isApproved ? 'approved' : (seller.status || 'pending'),
      sellerId: seller._id,
      createdAt: seller.createdAt,
      message: seller.validation?.message,
      approvedAt: seller.validation?.approvedAt
    });
  } catch (error) {
    console.error('Erreur complète:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut',
      error: error.message
    });
  }
};

export const getAllSellerRequests = async (req, res) => {
  try {
    const sellers = await Seller.find({ status: 'pending' })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des demandes de vendeur"
    });
  }
};

export const getSellerData = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await Seller.findById(sellerId)
      .populate('userId', 'name email')
      .lean();

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error fetching seller data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller data'
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log('=== DÉBUT CRÉATION PRODUIT ===');
    
    const sellerId = req.user.id;
    console.log('SellerId:', sellerId);
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    // Préparer les données de base du produit
    const productData = {
      name: req.body.name?.trim(),
      description: req.body.description?.trim(),
      price: Number(req.body.price),
      stock: Number(req.body.stock) || 0,
      category: req.body.category,
      subCategory: req.body.subCategory?.trim() || '',
      sellerId: sellerId,
      status: 'active',
      images: []
    };

    // Ajouter les images
    if (req.files?.images) {
      productData.images = req.files.images.map(file => 
        `/products/${file.filename}`
      );
    }

    // Ajouter les métadonnées
    if (req.body.metadata) {
      try {
        productData.metadata = JSON.parse(req.body.metadata);
      } catch (error) {
        console.warn('Erreur parsing metadata:', error);
      }
    }

    // Gérer la réduction
    if (req.body.discount) {
      try {
        const discountData = JSON.parse(req.body.discount);
        productData.discountPercentage = Number(discountData.percentage);
        productData.discountStartDate = new Date(discountData.startDate);
        productData.discountEndDate = new Date(discountData.endDate);
      } catch (error) {
        console.warn('Erreur parsing discount:', error);
        return res.status(400).json({
          success: false,
          message: "Format de réduction invalide",
          error: error.message
        });
      }
    }

    console.log('Final product data:', JSON.stringify(productData, null, 2));

    // Créer le produit
    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });

  } catch (error) {
    console.error('=== ERREUR CRÉATION PRODUIT ===');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.errors.map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    console.log('Fetching products for seller:', sellerId);

    const products = await Product.findAll({
      where: { sellerId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'name', 'description', 'price', 'category', 'images', 'stock', 'status']
    });

    res.status(200).json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Trouver le vendeur
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    // Obtenir les produits du vendeur
    const products = await Product.find({ sellerId: seller._id })
      .select('name price stock status')
      .sort('-createdAt')
      .limit(5);

    // Obtenir les statistiques de vente
    const stats = await Order.aggregate([
      { $match: { sellerId: seller._id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    // Obtenir les ventes par produit
    const salesByProduct = await Order.aggregate([
      { $match: { sellerId: seller._id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalSales: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Enrichir les données de vente avec les infos produits
    const productIds = salesByProduct.map(sale => sale._id);
    const productDetails = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(
      productDetails.map(p => [p._id.toString(), p])
    );

    const topProducts = salesByProduct.map(sale => ({
      id: sale._id,
      name: productMap[sale._id.toString()]?.name || 'Produit inconnu',
      totalSales: sale.totalSales,
      totalRevenue: sale.totalRevenue
    }));

    res.json({
      success: true,
      data: {
        stats: stats[0] || { totalRevenue: 0, totalOrders: 0 },
        recentProducts: products,
        topProducts: topProducts,
        salesChart: {
          labels: salesByProduct.map(p => productMap[p._id.toString()]?.name || 'Inconnu'),
          values: salesByProduct.map(p => p.totalRevenue)
        }
      }
    });

  } catch (error) {
    console.error('Erreur stats dashboard:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    const product = await Product.findOne({ 
      _id: productId,
      sellerId: seller._id 
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    await Product.deleteOne({ _id: productId });

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du produit"
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    const updates = req.body;
    
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, sellerId: seller._id },
      updates,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: product
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du produit"
    });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const seller = await Seller.findOne({ userId: sellerId });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Vendeur non trouvé"
      });
    }

    const orders = await Order.find({ sellerId: seller._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name email');

    const total = await Order.countDocuments({ sellerId: seller._id });

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customer: order.customerId?.name || 'Client anonyme',
          date: order.createdAt,
          total: order.total,
          status: order.status
        })),
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes"
    });
  }
};
