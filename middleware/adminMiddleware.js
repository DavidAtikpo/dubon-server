import jwt from'jsonwebtoken';
import { models } from '../models/index.js';

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await models.User.findByPk(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur middleware admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

export default adminMiddleware;
