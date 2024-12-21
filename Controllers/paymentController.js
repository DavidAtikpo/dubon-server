import { models } from '../models/index.js';
import Stripe from 'stripe';
import { FedaPay, Transaction } from 'fedapay';
import paypal from '@paypal/checkout-server-sdk';

// Vérifier que la clé API Stripe existe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY n\'est pas définie - Les paiements Stripe seront désactivés');
}

// Initialiser Stripe seulement si la clé est disponible
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Configuration FedaPay
let fedapay = null;
if (!process.env.FEDAPAY_SECRET_KEY) {
  console.warn('⚠️ FEDAPAY_SECRET_KEY n\'est pas définie - Les paiements FedaPay seront désactivés');
} else {
  try {
    FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY);
    FedaPay.setEnvironment(process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
    fedapay = Transaction;
    console.log('✅ FedaPay initialisé avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur d\'initialisation FedaPay:', error.message);
  }
}

// Configuration PayPal
const paypalClient = new paypal.core.PayPalHttpClient(
  process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
);

class PaymentController {
  // Initialiser un paiement
  async initializePayment(req, res) {
    try {
      const { amount, currency, paymentMethod, orderId } = req.body;

      switch (paymentMethod) {
        case 'stripe':
          return await this.initStripePayment(amount, currency, orderId, res);
        case 'fedapay':
          return await this.initFedaPayPayment(amount, currency, orderId, res);
        case 'paypal':
          return await this.initPayPalPayment(amount, currency, orderId, res);
        default:
          return res.status(400).json({
            success: false,
            message: 'Méthode de paiement non supportée'
          });
      }
    } catch (error) {
      console.error('Erreur initialisation paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement'
      });
    }
  }

  // Confirmer un paiement
  async confirmPayment(req, res) {
    try {
      const { paymentId, paymentMethod } = req.body;

      switch (paymentMethod) {
        case 'stripe':
          return await this.confirmStripePayment(paymentId, res);
        case 'fedapay':
          return await this.confirmFedaPayPayment(paymentId, res);
        case 'paypal':
          return await this.confirmPayPalPayment(paymentId, res);
        default:
          return res.status(400).json({
            success: false,
            message: 'Méthode de paiement non supportée'
          });
      }
    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement'
      });
    }
  }

  // Méthodes privées pour Stripe
  async initStripePayment(amount, currency, orderId, res) {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Le paiement par Stripe est temporairement indisponible'
      });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: { orderId }
      });

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Erreur Stripe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement Stripe'
      });
    }
  }

  async confirmStripePayment(paymentId, res) {
    const payment = await stripe.paymentIntents.retrieve(paymentId);
    
    if (payment.status === 'succeeded') {
      await this.updateOrderPaymentStatus(payment.metadata.orderId, 'completed');
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        message: 'Paiement non complété'
      });
    }
  }

  // Méthodes privées pour FedaPay
  async initFedaPayPayment(amount, currency, orderId, res) {
    if (!fedapay) {
      return res.status(503).json({
        success: false,
        message: 'Le paiement par FedaPay est temporairement indisponible'
      });
    }

    try {
      const transaction = await fedapay.create({
        amount,
        currency,
        description: `Commande #${orderId}`,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: { orderId }
      });

      res.json({
        success: true,
        transactionId: transaction.id,
        paymentUrl: transaction.payment_url
      });
    } catch (error) {
      console.error('Erreur FedaPay:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'initialisation du paiement FedaPay'
      });
    }
  }

  async confirmFedaPayPayment(paymentId, res) {
    if (!fedapay) {
      return res.status(503).json({
        success: false,
        message: 'Le paiement par FedaPay est temporairement indisponible'
      });
    }

    try {
      const transaction = await fedapay.retrieve(paymentId);
      
      if (transaction.status === 'approved') {
        await this.updateOrderPaymentStatus(transaction.metadata.orderId, 'completed');
        res.json({ success: true });
      } else {
        res.status(400).json({
          success: false,
          message: 'Paiement non complété'
        });
      }
    } catch (error) {
      console.error('Erreur confirmation FedaPay:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la confirmation du paiement'
      });
    }
  }

  // Méthodes privées pour PayPal
  async initPayPalPayment(amount, currency, orderId, res) {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        reference_id: orderId
      }]
    });

    const order = await paypalClient.execute(request);
    res.json({
      success: true,
      orderId: order.result.id
    });
  }

  async confirmPayPalPayment(paymentId, res) {
    const request = new paypal.orders.OrdersCaptureRequest(paymentId);
    const capture = await paypalClient.execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      await this.updateOrderPaymentStatus(
        capture.result.purchase_units[0].reference_id,
        'completed'
      );
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        message: 'Paiement non complété'
      });
    }
  }

  // Mettre à jour le statut de paiement d'une commande
  async updateOrderPaymentStatus(orderId, status) {
    await models.Order.update(
      { paymentStatus: status },
      { where: { id: orderId } }
    );
  }
}

export default new PaymentController();