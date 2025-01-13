import { models, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { createFedaPayTransaction, verifyTransaction } from '../utils/fedaPayUtils.js';
import { sendEmail } from '../utils/emailUtils.js';

// Vérifier le statut de l'abonnement
export const checkSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const activeSubscription = await models.Subscription.findOne({
      where: {
        userId,
        status: 'active',
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    // Vérifier si l'utilisateur a un abonnement en attente
    const pendingSubscription = await models.Subscription.findOne({
      where: {
        userId,
        status: 'pending'
      },
      order: [['createdAt', 'DESC']]
    });

    // Vérifier si l'utilisateur est déjà vendeur
    const sellerProfile = await models.SellerProfile.findOne({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        hasActiveSubscription: !!activeSubscription,
        hasPendingSubscription: !!pendingSubscription,
        isAlreadySeller: !!sellerProfile,
        subscription: activeSubscription || pendingSubscription,
        sellerProfile
      }
    });

  } catch (error) {
    console.error('Erreur vérification statut abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut de l\'abonnement'
    });
  }
};

export const initiateSubscription = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { planId, billingCycle, amount } = req.body;
    const userId = req.user.id;

    // Vérifier si l'utilisateur a déjà un abonnement actif
    const activeSubscription = await models.Subscription.findOne({
      where: {
        userId,
        status: 'active',
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (activeSubscription) {
      throw new Error('Vous avez déjà un abonnement actif');
    }

    // Vérifier si l'utilisateur a déjà un abonnement en attente
    const pendingSubscription = await models.Subscription.findOne({
      where: {
        userId,
        status: 'pending'
      }
    });

    if (pendingSubscription) {
      throw new Error('Vous avez déjà une demande d\'abonnement en cours');
    }

    // Récupérer les informations de l'utilisateur
    const user = await models.User.findByPk(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Créer l'enregistrement de souscription
    const subscription = await models.Subscription.create({
      userId,
      planId,
      billingCycle,
      amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000)
    }, { transaction });

    // Créer la transaction FedaPay avec les informations complètes du client
    const callbackUrl = `${process.env.BASE_URL}/api/subscription/callback/${subscription.id}`;
    const fedaPayTransaction = await createFedaPayTransaction({
      amount: parseInt(amount),
      description: `Abonnement ${planId} - ${billingCycle}`,
      customerId: userId,
      callbackUrl,
      customerEmail: user.email,
      customerName: user.name || user.firstName || 'Client'
    });

    // Mettre à jour la souscription avec l'ID de transaction
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
      message: error.message || 'Une erreur est survenue lors de l\'initiation de l\'abonnement'
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

      // Créer ou mettre à jour le profil vendeur
      const [sellerProfile] = await models.SellerProfile.findOrCreate({
        where: { userId: subscription.userId },
        defaults: {
          status: 'active',
          verificationStatus: 'pending',
          settings: {
            notifications: true,
            autoAcceptOrders: false,
            displayEmail: true,
            displayPhone: true,
            language: 'fr',
            currency: 'XOF'
          }
        },
        transaction
      });

      // Mettre à jour le rôle de l'utilisateur
      await models.User.update({
        role: 'seller'
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