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