import { models } from '../models/index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Op } from 'sequelize';

// Créer le dossier pour les images de restaurants


// Obtenir tous les restaurants
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await models.Restaurant.findAll({
      where: { status: 'active' },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email'],
      }],
      attributes: [
        'id', 
        'name', 
        'description', 
        'address', 
        'city', 
        'phoneNumber', 
        'email',
        'logo',
        'coverImage',
        'location',
        'status',
        'rating',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: restaurants,
      message: 'Restaurants récupérés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des restaurants',
      error: error.message
    });
  }
};

// Ajouter un restaurant
export const addRestaurant = async (req, res) => {
  try {
    console.log('User:', req.user);
    console.log('Données reçues:', req.body);
    console.log('Fichiers reçus:', req.files);

    const {
      name,
      description,
      address,
      city,
      phoneNumber,
      email,
      location
    } = req.body;

    // Validation des champs requis
    if (!name || !description || !address || !city || !phoneNumber) {
      console.log('Validation échouée:', {
        name: !!name,
        description: !!description,
        address: !!address,
        city: !!city,
        phoneNumber: !!phoneNumber
      });
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires',
        missingFields: {
          name: !name,
          description: !description,
          address: !address,
          city: !city,
          phoneNumber: !phoneNumber
        }
      });
    }

    if (!req.user?.id) {
      console.log('ID du vendeur manquant');
      return res.status(400).json({
        success: false,
        message: 'ID du vendeur manquant'
      });
    }

    // Vérifier les fichiers uploadés
    const logo = req.files?.logo?.[0]?.path;
    const coverImage = req.files?.coverImage?.[0]?.path;

    console.log('Logo path:', logo);
    console.log('Cover image path:', coverImage);

    const restaurantData = {
      name,
      description,
      address,
      city,
      phoneNumber,
      email: email || null,
      logo: logo || null,
      coverImage: coverImage || null,
      location: location || null,
      sellerId: req.user.id,
      status: 'pending'
    };

    console.log('Données du restaurant à créer:', restaurantData);

    // Créer le restaurant
    const restaurant = await models.Restaurant.create(restaurantData);

    console.log('Restaurant créé:', restaurant);

    res.status(201).json({
      success: true,
      message: 'Restaurant créé avec succès',
      restaurantId: restaurant.id,
      restaurant: restaurant
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création du restaurant:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du restaurant',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Obtenir un restaurant par ID
export const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await models.Restaurant.findByPk(req.params.id, {
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }],
      attributes: [
        'id', 
        'name', 
        'description', 
        'address', 
        'city', 
        'phoneNumber', 
        'email',
        'logo',
        'coverImage',
        'location',
        'status',
        'rating',
        'createdAt',
        'updatedAt'
      ]
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
      message: 'Restaurant récupéré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du restaurant',
      error: error.message
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

export const getSellerRestaurants = async (req, res) => {
  try {
    const sellerId = req.user.id;
    
    const restaurants = await models.Restaurant.findAll({
      where: { sellerId },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: restaurants,
      message: 'Restaurants récupérés avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des restaurants',
      error: error.message
    });
  }
}; 