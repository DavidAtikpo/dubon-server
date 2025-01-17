import { models } from '../models/index.js';
import FedaPayService from '../services/FedaPayService.js';
import { sendOrderConfirmationEmail } from '../utils/emailUtils.js';

const createPayment = async (req, res) => {
  try {
    console.log('Body reçu:', req.body);
    const { amount, paymentMethod, currency, orderId } = req.body;
    
    // Validation des données
    if (!orderId || !amount || paymentMethod !== 'fedapay') {
      return res.status(400).json({
        success: false,
        message: "Données de paiement invalides"
      });
    }

    console.log('Données reçues:', { orderId, amount, paymentMethod, currency, userId: req.user.id });

    // Vérifier que la commande existe
    const order = await models.Order.findOne({
      where: { 
        id: orderId,
        userId: req.user.id
      },
      include: [{
        model: models.User,
        as: 'user',
        attributes: ['email', 'name']
      }]
    });

    if (!order) {
      console.log('Commande non trouvée:', orderId);
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    console.log('Commande trouvée:', { 
      orderId: order.id, 
      userId: order.userId,
      userEmail: order.user?.email 
    });

    // Créer la transaction FedaPay
    const fedaPayTransaction = await FedaPayService.createTransaction({
      amount: parseFloat(amount),
      description: `Commande #${orderId}`,
      customerEmail: order.user.email,
      customerName: order.user.name,
      callbackUrl: `/api/payment/callback/${orderId}`
    });

    // Mettre à jour la commande avec l'ID de transaction
    await order.update({
      transactionId: fedaPayTransaction.id,
      paymentMethod: 'fedapay',
      paymentStatus: 'processing'
    });

    res.status(200).json({
      success: true,
      paymentUrl: fedaPayTransaction.paymentUrl
    });
  } catch (error) {
    console.error('Erreur création paiement:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de l'initialisation du paiement"
    });
  }
};

const handlePaymentCallback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transaction_id, status } = req.body;

    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [{
        model: models.User,
        as: 'user'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    // Vérifier le statut de la transaction avec FedaPay
    const transactionStatus = await FedaPayService.getTransactionStatus(transaction_id);

    if (transactionStatus === 'approved') {
      // Mettre à jour le statut de la commande
      await order.update({
        paymentStatus: 'completed',
        status: 'preparing'
      });

      // Envoyer l'email de confirmation
      try {
        await sendOrderConfirmationEmail(order, order.user);
      } catch (emailError) {
        console.error('Erreur envoi email confirmation:', emailError);
      }

      res.status(200).json({
        success: true,
        message: "Paiement confirmé"
      });
    } else {
      await order.update({
        paymentStatus: 'failed'
      });

      res.status(400).json({
        success: false,
        message: "Paiement échoué"
      });
    }
  } catch (error) {
    console.error('Erreur callback paiement:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du traitement du paiement"
    });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const order = await models.Order.findOne({
      where: { 
        transactionId,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Transaction non trouvée"
      });
    }

    const transactionStatus = await verifyTransaction(transactionId);

    res.status(200).json({
      success: true,
      status: transactionStatus.status
    });
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du statut"
    });
  }
};

export default {
  createPayment,
  handlePaymentCallback,
  checkPaymentStatus
};