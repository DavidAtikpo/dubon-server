import { models } from '../models/index.js';
import { createFedaPayTransaction } from '../utils/fedaPayUtils.js';
import { sendOrderConfirmationEmail } from '../utils/emailUtils.js';

export const createPayment = async (req, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const order = await models.Order.findOne({
      where: { id: orderId, userId },
      include: [{ model: models.User, as: 'user' }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    // Créer la transaction FedaPay
    const fedaPayTransaction = await createFedaPayTransaction({
      amount,
      description: `Commande #${orderId}`,
      customerEmail: order.user.email,
      customerName: order.user.name,
      callbackUrl: `/api/payment/callback/${orderId}`
    });

    res.json({
      success: true,
      token: fedaPayTransaction.token,
      publicKey: fedaPayTransaction.publicKey,
      amount: fedaPayTransaction.amount,
      description: fedaPayTransaction.description,
      customerEmail: order.user.email,
      customerFirstName: order.user.name.split(' ')[0],
      customerLastName: order.user.name.split(' ').slice(1).join(' '),
      customerPhone: order.user.phone
    });
  } catch (error) {
    console.error('Erreur création paiement:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement"
    });
  }
};

const handlePaymentCallback = async (req, res) => {
  try {
    console.log('📨 Callback FedaPay reçu:', req.body);
    const { event, data } = req.body;

    if (event === 'transaction.success') {
      const orderId = data.custom_data?.orderId || data.description.split('#')[1];
      console.log('🔍 Recherche de la commande:', orderId);

      // Mettre à jour le statut de la commande
      const order = await models.Order.findOne({
        where: { id: orderId }
      });

      if (!order) {
        console.error('❌ Commande non trouvée:', orderId);
        return res.status(404).json({
          success: false,
          message: "Commande non trouvée"
        });
      }

      // Mettre à jour le statut
      await order.update({
        paymentStatus: 'paid',
        status: 'processing'
      });

      // Envoyer un email de confirmation
      try {
        await sendOrderConfirmationEmail(order);
        console.log('✉️ Email de confirmation envoyé');
      } catch (emailError) {
        console.error('❌ Erreur envoi email:', emailError);
      }

      console.log('✅ Statut de commande mis à jour:', orderId);
      return res.json({ success: true });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Erreur callback paiement:', error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors du traitement du callback"
    });
  }
};

export default { createPayment, handlePaymentCallback };