import { models } from '../models/index.js';
const { Payment, Order } = models;

export const createPayment = async (req, res) => {
  try {
    const { orderId, method, amount } = req.body;

    // Vérifier si la commande existe
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    // Créer le paiement
    const payment = await Payment.create({
      orderId,
      method,
      amount,
      currency: 'XOF',
      status: 'pending',
      transactionId: `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`
    });

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
      error: error.message
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentDetails } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé"
      });
    }

    await payment.update({
      status,
      paymentDetails: { ...payment.paymentDetails, ...paymentDetails }
    });

    // Si le paiement est complété, mettre à jour le statut de la commande
    if (status === 'completed') {
      await Order.update(
        { status: 'confirmed' },
        { where: { id: payment.orderId } }
      );
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du paiement",
      error: error.message
    });
  }
};

export const getPaymentByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({
      where: { orderId },
      include: ['order']
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du paiement",
      error: error.message
    });
  }
};

export const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, amount } = req.body;

    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé"
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Seuls les paiements complétés peuvent être remboursés"
      });
    }

    await payment.update({
      status: 'refunded',
      refundDetails: {
        amount,
        reason,
        refundedAt: new Date(),
        refundedBy: req.user.id
      }
    });

    // Mettre à jour le statut de la commande
    await Order.update(
      { status: 'refunded' },
      { where: { id: payment.orderId } }
    );

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du remboursement",
      error: error.message
    });
  }
};

export const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
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