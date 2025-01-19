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
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

const { Product, SellerProfile, Category, Subcategory } = models;

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
    const product = await Product.findOne({
      where: { 
        id: req.params.productId,
        deletedAt: null
      },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: models.SellerProfile,
          as: 'seller',
          attributes: ['id', 'businessInfo', 'status']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    // Transformer les données pour inclure storeName depuis businessInfo
    const plainProduct = product.get({ plain: true });
    const transformedProduct = {
      ...plainProduct,
      seller: plainProduct.seller ? {
        id: plainProduct.seller.id,
        storeName: plainProduct.seller.businessInfo?.storeName || 'Boutique sans nom',
        status: plainProduct.seller.status
      } : null
    };

    res.status(200).json({
      success: true,
      data: transformedProduct
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du produit"
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    console.log("=== Début création produit ===");
    console.log("User ID:", req.user.id);
    console.log("Body reçu:", req.body);
    console.log("Fichiers reçus:", req.files);

    // Recherche du profil vendeur avec sa boutique
    const seller = await models.SellerProfile.findOne({
      where: { userId: req.user.id },
      include: [{
        model: models.Shop,
        as: 'shop'
      }]
    });

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    if (!seller.shop) {
      return res.status(404).json({
        success: false,
        message: "Boutique non trouvée pour ce vendeur"
      });
    }

    console.log("Profil vendeur trouvé:", seller.id);
    console.log("Boutique trouvée:", seller.shop.id);

    // Traitement des images
    let images = [];
    if (req.files && req.files.images) {
      images = req.files.images.map(file => file.path);
    }

    // Traitement des données JSON
    let nutritionalInfo = null;
    if (req.body.nutritionalInfo) {
      try {
        if (Array.isArray(req.body.nutritionalInfo)) {
          // Prendre le dernier élément s'il y en a plusieurs
          nutritionalInfo = JSON.parse(req.body.nutritionalInfo[req.body.nutritionalInfo.length - 1]);
        } else {
          nutritionalInfo = JSON.parse(req.body.nutritionalInfo);
        }
        // S'assurer que allergens est toujours un tableau
        nutritionalInfo.allergens = nutritionalInfo.allergens || [];
      } catch (e) {
        console.error('Erreur parsing nutritionalInfo:', e);
        nutritionalInfo = {
          calories: null,
          proteins: null,
          carbohydrates: null,
          fats: null,
          fiber: null,
          sodium: null,
          servingSize: null,
          allergens: []
        };
      }
    } else {
      nutritionalInfo = {
        calories: null,
        proteins: null,
        carbohydrates: null,
        fats: null,
        fiber: null,
        sodium: null,
        servingSize: null,
        allergens: []
      };
    }

    let temperature = null;
    if (req.body.temperature && typeof req.body.temperature === 'string') {
      try {
        temperature = JSON.parse(req.body.temperature);
      } catch (e) {
        console.error('Erreur parsing temperature:', e);
      }
    }

    let packaging = null;
    if (req.body.packaging && typeof req.body.packaging === 'string') {
      try {
        packaging = JSON.parse(req.body.packaging);
      } catch (e) {
        console.error('Erreur parsing packaging:', e);
      }
    }

    // Vérification de la catégorie si fournie
    let categoryId = null;
    let subcategoryId = null;
    if (req.body.categoryId) {
      console.log("Vérification de la catégorie:", req.body.categoryId);
      const category = await models.Category.findByPk(req.body.categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "La catégorie spécifiée n'existe pas"
        });
      }
      console.log("Catégorie trouvée:", category.name);
      categoryId = category.id;

      // Vérification de la sous-catégorie si fournie
      if (req.body.subcategoryId) {
        console.log("Vérification de la sous-catégorie:", req.body.subcategoryId);
        const subcategory = await models.Subcategory.findOne({
          where: {
            id: req.body.subcategoryId,
            categoryId: categoryId
          }
        });
        if (!subcategory) {
          return res.status(400).json({
            success: false,
            message: "La sous-catégorie spécifiée n'existe pas ou n'appartient pas à la catégorie sélectionnée"
          });
        }
        console.log("Sous-catégorie trouvée:", subcategory.name);
        subcategoryId = subcategory.id;
      }
    } else {
      console.log("Aucune catégorie spécifiée");
    }

    // Création du produit avec les données validées
    const productData = {
      sellerId: seller.id,
      shopId: seller.shop.id,
      name: req.body.name,
      slug: `${slugify(req.body.name, { lower: true })}-${Date.now()}`,
      description: req.body.description,
      shortDescription: req.body.shortDescription || '',
      sku: req.body.sku 
        ? `${req.body.sku}-${Date.now().toString().slice(-6)}` 
        : `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      price: parseFloat(req.body.price),
      compareAtPrice: req.body.compareAtPrice ? parseFloat(req.body.compareAtPrice) : null,
      quantity: parseInt(req.body.quantity) || 0,
      images,
      mainImage: images[0] || null,
      status: 'active',
      nutritionalInfo,
      temperature,
      packaging,
      productType: req.body.productType || 'frais',
      storageConditions: req.body.storageConditions || 'ambiant',
      expirationDate: req.body.expirationDate || null,
      shelfLife: req.body.shelfLife || null,
      origin: req.body.origin || '',
      featured: req.body.featured === 'true',
      categoryId: categoryId,
      subcategoryId: subcategoryId
    };

    console.log('Données du produit à créer:', productData);
    console.log('CategoryId dans les données:', productData.categoryId);

    const product = await models.Product.create(productData);

    console.log('Produit créé avec succès:', product.id);
    console.log('CategoryId du produit créé:', product.categoryId);

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

export const getAllPublicProducts = async (req, res) => {
  try {
    console.log('🔍 Récupération de tous les produits publics');
    
    const products = await Product.findAll({
      where: {
        deletedAt: null,
        status: 'active'
      },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: models.SellerProfile,
          as: 'seller',
          attributes: ['id', 'businessInfo', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transformer les données pour inclure storeName depuis businessInfo
    const transformedProducts = products.map(product => {
      const plainProduct = product.get({ plain: true });
      return {
        ...plainProduct,
        seller: plainProduct.seller ? {
          id: plainProduct.seller.id,
          storeName: plainProduct.seller.businessInfo?.storeName || 'Boutique sans nom',
          status: plainProduct.seller.status
        } : null
      };
    });

    res.status(200).json({
      success: true,
      products: transformedProducts
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits"
    });
  }
};

// Implémentation des méthodes manquantes
const getQuickSales = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active',
        discount: {
          [Op.gt]: 0
        }
      },
      limit: 8,
      order: [['discount', 'DESC']],
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0,
      discount: product.discount
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des ventes rapides",
      error: error.message
    });
  }
};

const getTopRated = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [[models.sequelize.literal('"ratings"->\'average\''), 'DESC']],
      limit: 8,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits les mieux notés",
      error: error.message
    });
  }
};

const getBestSellers = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [['salesCount', 'DESC']],
      limit: 8,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des meilleures ventes",
      error: error.message
    });
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [['createdAt', 'DESC']],
      limit: 8,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des nouveaux produits",
      error: error.message
    });
  }
};

const Promotion = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active',
        discount: {
          [Op.gt]: 0
        }
      },
      order: [['discount', 'DESC']],
      limit: 8,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0,
      discount: product.discount
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des promotions",
      error: error.message
    });
  }
};

const getNewProduct = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        status: 'active'
      },
      order: [['createdAt', 'DESC']],
      limit: 8,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des nouveaux produits",
      error: error.message
    });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.findAll({
      where: {
        status: 'active',
        '$category.name$': category
      },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });

    const formattedProducts = products.map(product => ({
      _id: product.id,
      title: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      category: product.category?.name || 'Non catégorisé',
      rating: product.ratings?.average || 0
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits par catégorie",
      error: error.message
    });
  }
};

export const getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.findAll({
      where: { 
        categoryId,
        status: 'active'
      },
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'id', 'name', 'price', 'images', 'mainImage', 
        'description', 'shortDescription', 'slug'
      ]
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erreur getProductsByCategoryId:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits de la catégorie",
      error: error.message
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    console.log("Début de la mise à jour du produit");
    console.log("Données reçues:", req.body);
    const { id } = req.params;
    // Vérifier si le produit existe
    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Produit non trouvé" });
    }

    // Vérifier que le vendeur est propriétaire du produit
    const seller = await SellerProfile.findOne({ where: { userId: req.user.id } });
    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({ success: false, message: "Non autorisé à modifier ce produit" });
    }

    // Préparer les données à mettre à jour
    let updatedData = {};

    // Copier les champs simples avec validation
    const simpleFields = ['name', 'description', 'status', 'productType', 'storageConditions'];
    simpleFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    });

    // Gérer séparément les champs numériques
    if (req.body.price !== undefined) {
      updatedData.price = parseFloat(req.body.price) || 0;
    }

    if (req.body.quantity !== undefined) {
      updatedData.quantity = parseInt(req.body.quantity) || 0;
    }

    if (req.body.compareAtPrice !== undefined) {
      updatedData.compareAtPrice = parseFloat(req.body.compareAtPrice) || null;
    }

    // Valider les données nutritionnelles
    if (req.body.nutritionalInfo) {
      try {
        let nutritionalInfo = typeof req.body.nutritionalInfo === 'string' 
          ? JSON.parse(req.body.nutritionalInfo)
          : req.body.nutritionalInfo;

        // S'assurer que allergens est un tableau
        if (nutritionalInfo.allergens) {
          nutritionalInfo.allergens = Array.isArray(nutritionalInfo.allergens)
            ? nutritionalInfo.allergens
            : typeof nutritionalInfo.allergens === 'string'
              ? nutritionalInfo.allergens.split(',').map(a => a.trim()).filter(Boolean)
              : [];
        }

        updatedData.nutritionalInfo = nutritionalInfo;
      } catch (error) {
        console.error('Erreur parsing nutritionalInfo:', error);
      }
    }

    // Valider la température
    if (req.body.temperature) {
      try {
        let temperature = typeof req.body.temperature === 'string'
          ? JSON.parse(req.body.temperature)
          : req.body.temperature;
        temperature.unit = '°C';
        updatedData.temperature = temperature;
      } catch (error) {
        console.error('Erreur parsing temperature:', error);
      }
    }

    // Gérer les nouvelles images
    if (req.files?.images) {
      const newImages = req.files.images.map(file => file.path.replace(/\\/g, '/'));
      
      // Supprimer les anciennes images
      const currentImages = Array.isArray(product.images) ? product.images : [];
      currentImages.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });

      // Mettre à jour avec les nouvelles images
      updatedData.images = newImages;
      updatedData.mainImage = newImages[0];
    }

    console.log("Données à mettre à jour:", updatedData);

    // Mise à jour du produit
    const updatedProduct = await product.update(updatedData);

    res.status(200).json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: updatedProduct
    });

  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du produit",
      error: error.message
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Vérifier si le produit existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Produit non trouvé"
      });
    }

    // Vérifier que le vendeur est propriétaire du produit
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!seller || product.sellerId !== seller.id) {
      return res.status(403).json({
        success: false,
        message: "Non autorisé à supprimer ce produit"
      });
    }

    // Supprimer les fichiers associés
    if (product.images && product.images.length > 0) {
      product.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    // Supprimer le produit
    await product.destroy();

    res.status(200).json({
      success: true,
      message: "Produit supprimé avec succès"
    });

  } catch (error) {
    console.error('Erreur suppression produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du produit",
      error: error.message
    });
  }
};

export const getShopProducts = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 12, sort = 'newest', category, minPrice, maxPrice } = req.query;

    // Construire les conditions de recherche
    const where = {
      shopId,
      status: 'active'
    };

    // Filtrer par catégorie si spécifié
    if (category) {
      where.categoryId = category;
    }

    // Filtrer par prix si spécifié
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    // Définir l'ordre de tri
    let order;
    switch (sort) {
      case 'price-asc':
        order = [['price', 'ASC']];
        break;
      case 'price-desc':
        order = [['price', 'DESC']];
        break;
      case 'popular':
        order = [['salesCount', 'DESC']];
        break;
      case 'rating':
        order = [['ratings.average', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les produits avec pagination
    const { count, rows: products } = await models.Product.findAndCountAll({
      where,
      include: [
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: models.Shop,
          as: 'shop',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: models.Rating,
          as: 'productRatings',
          attributes: ['rating'],
          required: false
        }
      ],
      order,
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        products,
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des produits de la boutique:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits de la boutique"
    });
  }
};

// Récupérer les produits similaires
export const getSimilarProducts = async (req, res) => {
  try {
    const { categoryId, productId } = req.params;

    // Récupérer les produits de la même catégorie (excluant le produit actuel)
    const similarProducts = await Product.findAll({
      where: {
        categoryId,
        id: { [Op.ne]: productId },
        status: 'active'
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'id', 'name', 'price', 'images', 'mainImage', 
        'description', 'shortDescription', 'slug'
      ],
      limit: 8,
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: similarProducts
    });
  } catch (error) {
    console.error('Erreur getSimilarProducts:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des produits similaires",
      error: error.message
    });
  }
};

// Mettre à jour l'objet productsController
const productsController = {
  addProduct,
  getAllProducts,
  getProductById,
  createProduct,
  getQuickSales,
  getTopRated,
  getBestSellers,
  getNewArrivals,
  Promotion,
  getNewProduct,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  getSellerProducts,
  getAllPublicProducts,
  getShopProducts,
  getSimilarProducts,
  getProductsByCategoryId
};

export default productsController;