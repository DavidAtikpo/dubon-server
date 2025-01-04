import { models } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

// Créer le dossier pour les images de restaurants
const createUploadDir = () => {
  const dir = 'uploads/restaurants';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

createUploadDir();

// Configuration de multer pour les restaurants
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/restaurants');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seules les images sont autorisées'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Obtenir tous les restaurants
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await models.Restaurant.findAll({
      where: { status: 'active' },
      include: [{
        model: models.SellerProfile,
        attributes: ['storeName', 'logo']
      }]
    });
    
    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Ajouter un restaurant
export const addRestaurant = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      address,
      phone,
      openingHours
    } = req.body;

    const imageUrl = req.file ? `/uploads/restaurants/${req.file.filename}` : null;

    const restaurant = await models.Restaurant.create({
      name,
      description,
      category,
      price,
      address,
      phone,
      openingHours: openingHours ? JSON.parse(openingHours) : undefined,
      image: imageUrl,
      sellerId: req.user.sellerId
    });

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir un restaurant par ID
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await models.Restaurant.findByPk(req.params.id, {
      include: [{
        model: models.SellerProfile,
        attributes: ['storeName', 'logo']
      }]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    res.json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour un restaurant
export const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await models.Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    // Vérifier que le vendeur est propriétaire du restaurant
    if (restaurant.sellerId !== req.user.sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce restaurant'
      });
    }

    const {
      name,
      description,
      category,
      price,
      address,
      phone,
      openingHours,
      status
    } = req.body;

    // Gérer la mise à jour de l'image
    let imageUrl = restaurant.image;
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (restaurant.image) {
        const oldImagePath = path.join(process.cwd(), restaurant.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/restaurants/${req.file.filename}`;
    }

    // Mettre à jour le restaurant
    await restaurant.update({
      name: name || restaurant.name,
      description: description || restaurant.description,
      category: category || restaurant.category,
      price: price || restaurant.price,
      address: address || restaurant.address,
      phone: phone || restaurant.phone,
      openingHours: openingHours ? JSON.parse(openingHours) : restaurant.openingHours,
      image: imageUrl,
      status: status || restaurant.status
    });

    res.json({
      success: true,
      message: 'Restaurant mis à jour avec succès',
      data: restaurant
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Supprimer un restaurant
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await models.Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    // Vérifier que le vendeur est propriétaire du restaurant
    if (restaurant.sellerId !== req.user.sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce restaurant'
      });
    }

    // Supprimer l'image si elle existe
    if (restaurant.image) {
      const imagePath = path.join(process.cwd(), restaurant.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await restaurant.destroy();

    res.json({
      success: true,
      message: 'Restaurant supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Rechercher des restaurants
export const searchRestaurants = async (req, res) => {
  try {
    const { query, category, minPrice, maxPrice, rating } = req.query;
    
    const whereClause = {
      status: 'active'
    };

    if (query) {
      whereClause.name = {
        [models.Sequelize.Op.iLike]: `%${query}%`
      };
    }

    if (category) {
      whereClause.category = category;
    }

    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price[models.Sequelize.Op.gte] = minPrice;
      if (maxPrice) whereClause.price[models.Sequelize.Op.lte] = maxPrice;
    }

    if (rating) {
      whereClause.rating = {
        [models.Sequelize.Op.gte]: rating
      };
    }

    const restaurants = await models.Restaurant.findAll({
      where: whereClause,
      include: [{
        model: models.SellerProfile,
        attributes: ['storeName', 'logo']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getFeaturedRestaurants = async (req, res) => {
  try {
    const restaurants = await models.Restaurant.findAll({
      where: {
        rating: {
          [Op.gte]: 4
        },
        isVerified: true
      },
      limit: 6,
      order: [['rating', 'DESC']]
    });

    res.json({
      success: true,
      data: restaurants
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des restaurants'
    });
  }
}; 