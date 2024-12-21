import { models } from '../models/index.js';
import { Op } from 'sequelize';

const { Product, Seller } = models;

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
    const seller = await Seller.findOne({
      where: { userId: req.user.id }
    });

    if (!seller) {
      return res.status(403).json({
        success: false,
        message: "Vous devez être vendeur pour créer un produit"
      });
    }

    const productData = JSON.parse(req.body.data);
    const images = req.files?.images?.map(file => file.path) || [];
    const imageUrls = req.body.imageUrls || [];
    const videoPath = req.files?.video?.[0]?.path;

    const product = await Product.create({
      ...productData,
      images: [...images, ...imageUrls],
      videoUrl: videoPath,
      sellerId: seller.id
    });

    res.status(201).json({
      success: true,
      message: "Produit créé avec succès",
      data: product
    });

  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du produit"
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