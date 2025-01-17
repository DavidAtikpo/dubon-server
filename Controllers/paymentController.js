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
      callbackUrl: `api/payment/callback/${orderId}`
    });

    return res.json(fedaPayTransaction);

  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement"
    });
  }
};

export default { createPayment };