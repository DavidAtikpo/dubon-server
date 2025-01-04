import { models } from '../models/index.js';

export const getFeaturedServices = async (req, res) => {
  try {
    const services = await models.Service.findAll({
      where: {
        isActive: true
      },
      limit: 6,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des services'
    });
  }
}; 