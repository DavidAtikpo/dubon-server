import { models, sequelize } from '../models/index.js';
import { createFedaPayTransaction, verifyTransaction } from '../utils/fedaPayUtils.js';
import { sendEmail } from '../utils/emailUtils.js';

export const initiateSubscription = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { planId, billingCycle, amount } = req.body;
    const userId = req.user.id;

    // Créer l'enregistrement de souscription
    const subscription = await models.Subscription.create({
      userId,
      planId,
      billingCycle,
      amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
    }, { transaction });

    // Créer la transaction FedaPay
    const fedaPayTransaction = await createFedaPayTransaction({
      amount,
      description: `Abonnement ${planId} - ${billingCycle}`,
      customerId: userId,
      callbackUrl: `${process.env.BASE_URL}/api/subscription/callback/${subscription.id}`,
      currency: 'XOF'
    });

    await subscription.update({
      transactionId: fedaPayTransaction.id
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      paymentUrl: fedaPayTransaction.paymentUrl,
      subscriptionId: subscription.id
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur initiation abonnement:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const handlePaymentCallback = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { subscriptionId } = req.params;
    const { transaction_id } = req.body;

    // Vérifier la transaction FedaPay
    const paymentStatus = await verifyTransaction(transaction_id);

    const subscription = await models.Subscription.findByPk(subscriptionId, {
      include: [{ model: models.User, as: 'user' }]
    });

    if (!subscription) {
      throw new Error('Souscription non trouvée');
    }

    if (paymentStatus.status === 'approved') {
      // Activer l'abonnement
      await subscription.update({
        status: 'active',
        activatedAt: new Date()
      }, { transaction });

      // Mettre à jour le statut du vendeur
      await models.User.update({
        sellerStatus: 'active'
      }, { 
        where: { id: subscription.userId },
        transaction 
      });

      // Envoyer un email de confirmation
      await sendEmail({
        to: subscription.user.email,
        subject: 'Abonnement activé avec succès',
        template: 'subscription-activated',
        context: {
          name: subscription.user.name,
          planName: subscription.planId === 'monthly' ? 'Mensuel' : 'Annuel',
          expiresAt: subscription.expiresAt
        }
      });
    }

    await transaction.commit();

    // Rediriger vers la page de succès/échec
    res.redirect(`/seller/dashboard/subscription/status?status=${paymentStatus.status}`);

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur callback paiement:', error);
    res.redirect('/seller/dashboard/subscription/status?status=error');
  }
}; 