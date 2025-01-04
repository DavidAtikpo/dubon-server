import { models } from '../models/index.js';
import { Op } from 'sequelize';

export const getFeaturedTrainings = async (req, res) => {
  try {
    const trainings = await models.Training.findAll({
      where: {
        startDate: {
          [Op.gte]: new Date() // Formations à venir uniquement
        }
      },
      limit: 6,
      order: [['startDate', 'ASC']]
    });

    res.json({
      success: true,
      data: trainings
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des formations'
    });
  }
}; 