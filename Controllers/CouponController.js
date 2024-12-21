import { models } from '../models/index.js';
const { Coupon, Order } = models;
import { Op } from 'sequelize';

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du coupon",
      error: error.message
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, amount, userId } = req.body;
    
    const coupon = await Coupon.findOne({
      where: {
        code,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon invalide ou expiré"
      });
    }

    // Vérifier le montant minimum
    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Le montant minimum d'achat est de ${coupon.minPurchase} XOF`
      });
    }

    // Vérifier la limite d'utilisation globale
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Ce coupon a atteint sa limite d'utilisation"
      });
    }

    // Vérifier la limite par utilisateur
    const userUsageCount = await Order.count({
      where: {
        userId,
        couponCode: code
      }
    });

    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà utilisé ce coupon le nombre maximum de fois"
      });
    }

    // Calculer la réduction
    let discount = coupon.type === 'percentage' 
      ? (amount * coupon.value / 100)
      : coupon.value;

    // Appliquer le maximum de réduction si défini
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    res.status(200).json({
      success: true,
      data: {
        discount,
        coupon
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du coupon",
      error: error.message
    });
  }
};

export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const coupons = await Coupon.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        coupons: coupons.rows,
        total: coupons.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(coupons.count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des coupons",
      error: error.message
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon non trouvé"
      });
    }

    await coupon.update(req.body);
    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du coupon",
      error: error.message
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon non trouvé"
      });
    }

    await coupon.destroy();
    res.status(200).json({
      success: true,
      message: "Coupon supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du coupon",
      error: error.message
    });
  }
};

export const getCouponStats = async (req, res) => {
  try {
    const stats = await Coupon.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('usageCount')), 'totalUsage']
      ],
      group: ['status']
    });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
}; 