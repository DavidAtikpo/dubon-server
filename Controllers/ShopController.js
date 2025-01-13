import { models } from '../models/index.js';
import { Op } from 'sequelize';


export const getFeaturedShops = async (req, res) => {
  try {
    const shops = await models.Shop.findAll({
      where: {
        rating: {
          [Op.gte]: 4 // Boutiques avec une note >= 4
        }
      },
      limit: 6,
      order: [['rating', 'DESC']]
    });

    res.json({
      success: true,
      data: shops
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des boutiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des boutiques'
    });
  }
};

export const createShop = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const sellerId = req.user.id;
    
    // 1. Vérifier si le vendeur est approuvé
    const sellerProfile = await models.SellerProfile.findOne({
      where: { 
        userId: sellerId,
        status: 'active',
        verificationStatus: 'verified'
      }
    });

    if (!sellerProfile) {
      throw new Error('Vous devez être un vendeur vérifié');
    }

    // 2. Vérifier s'il n'a pas déjà une boutique
    const existingShop = await models.Shop.findOne({
      where: { sellerId: sellerProfile.id }
    });

    if (existingShop) {
      throw new Error('Vous avez déjà une boutique');
    }

    // 3. Créer la boutique
    const shop = await models.Shop.create({
      sellerId: sellerProfile.id,
      name: req.body.name,
      description: req.body.description,
      logo: req.files?.logo?.[0]?.path,
      // ... autres champs
    }, { transaction });

    await transaction.commit();
    res.status(201).json({
      success: true,
      data: shop
    });

  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer tous les magasins
export const getAllShops = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'rating';
    const order = req.query.order || 'DESC';

    // Pour les utilisateurs normaux, on ne montre que les informations essentielles
    const attributes = [
      'id',
      'name',
      'description',
      'logo',
      'coverImage',
      'rating',
      'status',
      'location'
    ];

    const { count, rows: shops } = await models.Shop.findAndCountAll({
      where: { status: 'active' },
      include: [
        {
          model: models.Product,
          as: 'products',
          attributes: ['id'],
          where: { status: 'active' },
          required: false
        }
      ],
      attributes,
      order: [[sortBy, order]],
      offset,
      limit
    });

    // Transformer les données pour le frontend
    const transformedShops = shops.map(shop => ({
      _id: shop.id,
      name: shop.name,
      description: shop.description,
      logo: shop.logo,
      coverImage: shop.coverImage,
      rating: shop.rating || 0,
      status: shop.status,
      location: shop.location,
      productsCount: shop.products ? shop.products.length : 0
    }));

    res.status(200).json({
      success: true,
      data: transformedShops,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        hasMore: page < Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des magasins:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des magasins"
    });
  }
};

// Récupérer un magasin par son ID
export const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await models.Shop.findOne({
      where: { 
        id,
        status: 'active'
      },
      include: [
        {
          model: models.SellerProfile,
          as: 'seller',
          attributes: ['id', 'businessInfo'],
          include: [{
            model: models.User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }]
        },
        {
          model: models.Product,
          as: 'products',
          where: { status: 'active' },
          required: false // Pour ne pas exclure les magasins sans produits
        }
      ]
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Magasin non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du magasin:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du magasin"
    });
  }
};

export const updateShop = async (req, res) => {
  try {
    // Récupérer d'abord le profil vendeur
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!sellerProfile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Récupérer la boutique du vendeur
    const shop = await models.Shop.findOne({
      where: { 
        sellerId: sellerProfile.id
      }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Boutique non trouvée"
      });
    }

    const { name, description, address, phone, email } = req.body;
    const logo = req.files?.logo?.[0];
    const coverImage = req.files?.coverImage?.[0];

    // Update basic info
    if (name) shop.name = name;
    if (description) shop.description = description;
    if (address) shop.address = address;
    if (phone) shop.phone = phone;
    if (email) shop.email = email;

    // Handle file uploads
    if (logo) {
      shop.logo = `uploads/shops/${logo.filename}`;
    }
    if (coverImage) {
      shop.coverImage = `uploads/shops/${coverImage.filename}`;
    }

    await shop.save();

    return res.status(200).json({
      success: true,
      message: "Boutique mise à jour avec succès",
      data: shop
    });

  } catch (error) {
    console.error('Error updating shop:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la boutique",
      error: error.message
    });
  }
};

// Récupérer la boutique du vendeur connecté
export const getSellerShop = async (req, res) => {
  try {
    // D'abord récupérer le profil vendeur
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!sellerProfile) {
      return res.status(404).json({
        success: false,
        message: "Profil vendeur non trouvé"
      });
    }

    // Ensuite récupérer la boutique avec ce sellerId
    const shop = await models.Shop.findOne({
      where: { sellerId: sellerProfile.id },
      include: [{
        model: models.Product,
        as: 'products',
        attributes: ['id', 'name', 'price', 'mainImage', 'description', 'status', 'quantity'],
        where: {
          deletedAt: null
        },
        required: false
      }]
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Boutique non trouvée"
      });
    }

    return res.status(200).json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la boutique:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la boutique"
    });
  }
}; 