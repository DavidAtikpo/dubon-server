import { models } from '../models/index.js';
import { Op } from 'sequelize';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer les dossiers d'upload si ils n'existent pas
const uploadDirs = [
  path.join(__dirname, '../uploads/products'),
  path.join(__dirname, '../uploads/digital')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration de Multer pour les uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Choisir le dossier en fonction du type de fichier
    const isDigital = req.body.isDigital === 'true' && file.fieldname === 'digitalFiles';
    const uploadPath = isDigital ? uploadDirs[1] : uploadDirs[0];
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Seules les images sont acceptées.'), false);
    }
  } else if (file.fieldname === 'digitalFiles') {
    // Accepter les fichiers digitaux (à adapter selon vos besoins)
    const allowedMimes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier digital non supporté.'), false);
    }
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Maximum 10 fichiers
  }
});

const { Product, SellerProfile } = models;

// Méthodes du contrôleur
export const addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: "Produit ajouté avec succès",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout du produit",
      error: error.message
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    // Récupérer le profil vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Récupérer uniquement les produits du vendeur
    const products = await Product.findAll({
      where: { sellerId: seller.id },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Formater les données pour le frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.quantity,
      status: product.status,
      category: product.category?.name || 'Non catégorisé',
      images: product.images || [],
      lowStockThreshold: product.lowStockThreshold
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits",
      error: error.message
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du produit",
      error: error.message
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log('=== Début création produit ===');
    console.log('User ID:', req.user.id);
    console.log('Body reçu:', req.body);
    console.log('Fichiers reçus:', req.files);

    // Vérifier ou créer le profil vendeur
    let seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      // Récupérer les informations de l'utilisateur
      const user = await models.User.findByPk(req.user.id);
      
      // Créer un profil vendeur si il n'existe pas
      seller = await SellerProfile.create({
        userId: req.user.id,
        status: 'active',
        storeName: user.name || 'Ma Boutique',
        description: 'Description de la boutique',
        address: user.address || '',
        phone: user.phone || '',
        email: user.email || '',
        logo: null,
        banner: null,
        socialMedia: {},
        settings: {
          currency: 'XOF',
          language: 'fr',
          timezone: 'Africa/Porto-Novo'
        }
      });
      console.log('Nouveau profil vendeur créé:', seller.id);
    }

    // Validation des champs requis
    const requiredFields = ['name', 'price', 'description'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Champs requis manquants: ${missingFields.join(', ')}`
      });
    }

    // Traitement des images
    const images = req.files?.images?.map(file => file.path.replace(/\\/g, '/')) || [];
    
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Au moins une image est requise"
      });
    }

    // Parse des données JSON
    let dimensions = {};
    try {
      dimensions = JSON.parse(req.body.dimensions);
    } catch (e) {
      console.error('Erreur parsing dimensions:', e);
    }

    let attributes = {};
    try {
      attributes = JSON.parse(req.body.attributes);
    } catch (e) {
      console.error('Erreur parsing attributes:', e);
    }

    // Trouver ou créer la catégorie
    let categoryId = null;
    if (req.body.categoryId) {
      try {
        const [category] = await models.Category.findOrCreate({
          where: { name: req.body.categoryId },
          defaults: {
            name: req.body.categoryId,
            slug: slugify(req.body.categoryId, { lower: true }),
            description: `Catégorie ${req.body.categoryId}`
          }
        });
        categoryId = category.id;
      } catch (error) {
        console.error('Erreur création catégorie:', error);
      }
    }

    // Création du produit avec les données validées
    const productData = {
      sellerId: seller.id,
      name: req.body.name,
      slug: `${slugify(req.body.name, { lower: true })}-${Date.now()}`,
      description: req.body.description,
      shortDescription: req.body.shortDescription || '',
      sku: req.body.sku || `SKU-${Date.now()}`,
      barcode: req.body.barcode || null,
      price: parseFloat(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? parseFloat(req.body.compareAtPrice) : null,
      costPrice: req.body.costPrice ? parseFloat(req.body.costPrice) : null,
      quantity: parseInt(req.body.quantity) || 0,
      lowStockThreshold: parseInt(req.body.lowStockThreshold) || 5,
      weight: req.body.weight ? parseFloat(req.body.weight) : null,
      dimensions,
      images,
      mainImage: images[0],
      status: 'active',
      isDigital: req.body.isDigital === 'true',
      attributes,
      categoryId: categoryId,
      seoTitle: req.body.seoTitle || '',
      seoDescription: req.body.seoDescription || '',
      seoKeywords: req.body.seoKeywords ? 
        req.body.seoKeywords.split(',').map(keyword => keyword.trim()) : 
        [],
      ratings: {
        average: 0,
        count: 0
      },
      featured: false,
      digitalFiles: [],
      variants: [],
      tags: [],
      metadata: {}
    };

    console.log('Données du produit à créer:', productData);

    const product = await Product.create(productData);

    console.log('Produit créé avec succès:', product.id);

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });

  } catch (error) {
    console.error('Erreur création produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit",
      error: error.message
    });
  }
};

export const getSellerProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;

    // Récupérer le profil vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Construire les conditions de recherche
    const whereConditions = {
      sellerId: seller.id
    };

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (category && category !== 'all') {
      whereConditions['$category.name$'] = category;
    }

    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Récupérer les produits avec pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Formater les données pour le frontend
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.quantity,
      status: product.status,
      category: product.category?.name || 'Non catégorisé',
      images: product.images || [],
      lowStockThreshold: product.lowStockThreshold,
      createdAt: product.createdAt
    }));

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Récupérer les statistiques
    const stats = {
      total: count,
      active: await Product.count({ 
        where: { 
          sellerId: seller.id,
          status: 'active'
        }
      }),
      lowStock: await Product.count({
        where: {
          sellerId: seller.id,
          quantity: {
            [Op.lte]: 5
          }
        }
      })
    };

    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        hasNextPage,
        hasPrevPage,
        limit
      },
      stats
    });
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits",
      error: error.message
    });
  }
};

// Autres méthodes nécessaires
const productsController = {
  addProduct,
  getAllProducts,
  getProductById,
  getQuickSales: async (req, res) => {
    // Implémentation...
  },
  getTopRated: async (req, res) => {
    // Implémentation...
  },
  getBestSellers: async (req, res) => {
    // Implémentation...
  },
  getNewArrivals: async (req, res) => {
    // Implémentation...
  },
  Promotion: async (req, res) => {
    // Implémentation...
  },
  getNewProduct: async (req, res) => {
    // Implémentation...
  },
  getProductsByCategory: async (req, res) => {
    // Implémentation...
  },
  updateProduct: async (req, res) => {
    // Implémentation...
  },
  deleteProduct: async (req, res) => {
    // Implémentation...
  },
  getSellerProducts
};

export default productsController;