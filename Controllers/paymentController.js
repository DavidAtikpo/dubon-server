import Order from '../models/Order.js';
// import Stripe from 'stripe';
// import paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';

// Configuration FedaPay API
const fedapayAPI = axios.create({
  baseURL: 'https://api.fedapay.com/v1',
  headers: {
    'Authorization': `Bearer ${process.env.FEDAPAY_PRIVATE_KEY}`,
    'Content-Type': 'application/json'
  }
});

// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Configuration PayPal
// const paypalClient = () => {
//   const environment = process.env.PAYPAL_SANDBOX === 'true'
//     ? new paypal.core.SandboxEnvironment(
//         process.env.PAYPAL_CLIENT_ID,
//         process.env.PAYPAL_CLIENT_SECRET
//       )
//     : new paypal.core.LiveEnvironment(
//         process.env.PAYPAL_CLIENT_ID,
//         process.env.PAYPAL_CLIENT_SECRET
//       );
//   return new paypal.core.PayPalHttpClient(environment);
// };

export const createFedaPayPayment = async (req, res) => {
  try {
    const { customer, items, amount } = req.body;

    // Validation des données requises
    if (!customer || !items || !amount) {
      return res.status(400).json({ error: 'Données de paiement incomplètes' });
    }

    // Créer une commande dans MongoDB
    const order = new Order({
      customer,
      items,
      totalAmount: amount,
      paymentMethod: 'fedapay',
      paymentStatus: 'pending',
      createdAt: new Date()
    });
    await order.save();

    // Créer la transaction FedaPay avec plus de détails
    const transaction = await fedapayAPI.post('/transactions', {
      description: `Commande #${order._id}`,
      amount: amount,
      currency: { iso: 'XOF' },
      callback_url: `${process.env.FRONTEND_URL}/api/payments/fedapay/callback`,
      return_url: `${process.env.FRONTEND_URL}/checkout/success`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      customer: {
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email,
        phone_number: customer.phone
      },
      metadata: {
        orderId: order._id.toString(),
        items: JSON.stringify(items)
      }
    });

    if (!transaction.data || !transaction.data.url) {
      throw new Error('URL de paiement FedaPay non générée');
    }

    // Mettre à jour la commande avec l'ID de transaction
    await Order.findByIdAndUpdate(order._id, {
      transactionId: transaction.data.id
    });

    res.json({ 
      success: true, 
      paymentUrl: transaction.data.url,
      orderId: order._id 
    });

  } catch (error) {
    console.error('FedaPay error:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'initialisation du paiement FedaPay',
      details: error.message 
    });
  }
};

// export const createPayPalPayment = async (req, res) => {
//   try {
//     const { customer, items, amount } = req.body;

//     // Créer une commande dans MongoDB
//     const order = new Order({
//       customer,
//       items,
//       totalAmount: amount,
//       paymentMethod: 'paypal'
//     });
//     await order.save();

//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer("return=representation");
//     request.requestBody({
//       intent: 'CAPTURE',
//       purchase_units: [{
//         amount: {
//           currency_code: 'EUR',
//           value: (amount / 655.957).toFixed(2)
//         },
//         description: `Commande #${order._id}`,
//         custom_id: order._id.toString()
//       }],
//       application_context: {
//         return_url: `${process.env.FRONTEND_URL}/checkout/success`,
//         cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`
//       }
//     });

//     const paypalOrder = await paypalClient().execute(request);
//     const approvalUrl = paypalOrder.result.links.find(
//       link => link.rel === 'approve'
//     )?.href;

//     res.json({ success: true, paymentUrl: approvalUrl });
//   } catch (error) {
//     console.error('PayPal error:', error);
//     res.status(500).json({ error: 'Erreur lors de l\'initialisation du paiement PayPal' });
//   }
// };

// export const createStripePayment = async (req, res) => {
//   try {
//     const { customer, items, amount } = req.body;

//     // Créer une commande dans MongoDB
//     const order = new Order({
//       customer,
//       items,
//       totalAmount: amount,
//       paymentMethod: 'stripe'
//     });
//     await order.save();

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: items.map(item => ({
//         price_data: {
//           currency: 'eur',
//           product_data: { name: item.title },
//           unit_amount: Math.round((item.price / 655.957) * 100)
//         },
//         quantity: item.quantity,
//       })),
//       mode: 'payment',
//       success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
//       customer_email: customer.email,
//       metadata: {
//         orderId: order._id.toString()
//       }
//     });

//     res.json({ success: true, paymentUrl: session.url });
//   } catch (error) {
//     console.error('Stripe error:', error);
//     res.status(500).json({ error: 'Erreur lors de l\'initialisation du paiement Stripe' });
//   }
// };

// export const handleWebhook = async (req, res) => {
//   const signature = req.headers['stripe-signature'];
  
//   try {
//     // Gérer les webhooks selon le service de paiement
//     const event = stripe.webhooks.constructEvent(
//       req.body,
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object;
//       const orderId = session.metadata.orderId;

//       await Order.findByIdAndUpdate(orderId, {
//         paymentStatus: 'completed',
//         transactionId: session.payment_intent
//       });
//     }

//     res.json({ received: true });
//   } catch (error) {
//     console.error('Webhook Error:', error);
//     res.status(400).send(`Webhook Error: ${error.message}`);
//   }
// };