import { models } from '../models/index.js';
import { createFedaPayTransaction } from '../utils/fedaPayUtils.js';
import { sendOrderConfirmationEmail } from '../utils/emailUtils.js';

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user.id;

    if (!items || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis"
      });
    }

    // Récupérer l'utilisateur
    const user = await models.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Grouper les items par vendeur et calculer le total
    const itemsBySeller = items.reduce((acc, item) => {
      const sellerId = item.sellerId;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          items: [],
          total: 0
        };
      }
      acc[sellerId].items.push(item);
      acc[sellerId].total += item.finalPrice * item.quantity;
      return acc;
    }, {});

    // Créer une commande pour chaque vendeur
    const orders = [];
    for (const sellerId in itemsBySeller) {
      const sellerItems = itemsBySeller[sellerId];
      
      const order = await models.Order.create({
        userId,
        sellerId,
        total: sellerItems.total,
        items: sellerItems.items,
        shippingAddress,
        status: 'pending',
        paymentStatus: 'pending'
      });

      // Initialiser la transaction FedaPay pour cette commande
      const fedaPayTransaction = await createFedaPayTransaction({
        amount: sellerItems.total,
        description: `Commande #${order.id}`,
        customerEmail: shippingAddress.email,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        callbackUrl: `api/payment/callback/${order.id}`
      });

      // Mettre à jour la commande avec l'ID de transaction
      await order.update({
        transactionId: fedaPayTransaction.id,
        paymentMethod: 'fedapay'
      });

      orders.push({
        orderId: order.id,
        paymentUrl: fedaPayTransaction.paymentUrl
      });
    }

    res.status(201).json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la commande"
    });
  }
};

// Récupérer les commandes d'un utilisateur
const getOrdersByUserId = async (req, res) => {
  try {
    const orders = await models.Order.findAll({
      where: { userId: req.user.id },
      include: [{
        model: models.OrderItem,
        as: 'orderItems'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes"
    });
  }
};

// Récupérer une commande par son ID
const getOrderById = async (req, res) => {
  try {
    const order = await models.Order.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [{
        model: models.OrderItem,
        as: 'orderItems'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la commande"
    });
  }
};

// Mettre à jour le statut d'une commande
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await models.Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    await order.update({ status });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la commande"
    });
  }
};

export default {
  createOrder,
  getOrdersByUserId,
  getOrderById,
  updateOrderStatus
};