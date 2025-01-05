import { models } from '../models/index.js';
import { Op } from 'sequelize';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const products = await Product.findAll();
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
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
    console.log('Début création produit');
    console.log('User ID:', req.user.id);

    // Vérifier si l'utilisateur est un vendeur
    const seller = await SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    console.log('Profil vendeur trouvé:', seller?.id);

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Vous devez être vendeur pour créer un produit"
      });
    }

    // Log des données reçues
    console.log('Body reçu:', req.body);
    console.log('Fichiers reçus:', req.files);

    // Traiter les données du formulaire
    const formData = req.body;
    const files = req.files || {};

    // Créer le slug à partir du nom
    const slug = slugify(formData.name || 'produit', { lower: true });

    // Traiter les images avec vérification
    const images = files.images ? 
      files.images.map(file => file.path.replace(/\\/g, '/')) : 
      [];

    console.log('Images traitées:', images);

    // Traiter les fichiers digitaux avec vérification
    const digitalFiles = files.digitalFiles ? 
      files.digitalFiles.map(file => ({
        name: file.originalname,
        path: file.path.replace(/\\/g, '/'),
        type: file.mimetype,
        size: file.size
      })) : [];

    console.log('Fichiers digitaux traités:', digitalFiles);

    // Vérifier et parser les données JSON
    let dimensions = {};
    try {
      dimensions = formData.dimensions ? JSON.parse(formData.dimensions) : {};
    } catch (e) {
      console.error('Erreur parsing dimensions:', e);
    }

    let attributes = {};
    try {
      attributes = formData.attributes ? JSON.parse(formData.attributes) : {};
    } catch (e) {
      console.error('Erreur parsing attributes:', e);
    }

    // Créer l'objet produit avec vérification des valeurs
    const productData = {
      sellerId: seller.id,
      name: formData.name || 'Produit sans nom',
      slug,
      description: formData.description || '',
      shortDescription: formData.shortDescription || '',
      sku: formData.sku || `SKU-${Date.now()}`,
      barcode: formData.barcode || null,
      price: parseFloat(formData.price) || 0,
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
      quantity: parseInt(formData.quantity) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      dimensions,
      images,
      mainImage: images[0] || null,
      status: 'active',
      isDigital: formData.isDigital === 'true',
      digitalFiles: formData.isDigital === 'true' ? digitalFiles : [],
      attributes,
      categoryId: formData.categoryId || null,
      seoTitle: formData.seoTitle || '',
      seoDescription: formData.seoDescription || '',
      seoKeywords: formData.seoKeywords ? 
        formData.seoKeywords.split(',').map(keyword => keyword.trim()) : 
        [],
      metadata: {
        createdBy: req.user.id,
        createdAt: new Date()
      }
    };

    console.log('Données du produit à créer:', productData);

    // Créer le produit
    const product = await Product.create(productData);

    console.log('Produit créé avec succès:', product.id);

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });

  } catch (error) {
    console.error('Erreur détaillée création produit:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
  }
};

export default productsController;