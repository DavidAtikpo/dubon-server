import { models } from '../models/index.js';

export const getPlans = async (req, res) => {
  try {
    const plans = await models.Plan.findAll({
      where: { isActive: true },
      order: [['monthlyPrice', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Erreur récupération plans:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des plans"
    });
  }
}; 