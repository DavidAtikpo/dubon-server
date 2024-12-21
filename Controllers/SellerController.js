// ... code existant ...

// Gestion du profil vendeur
export const getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({
      where: { userId: req.user.id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'phone']
      }]
    });

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil"
    });
  }
};

export const updateSellerProfile = async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) {
      updates.photo = req.file.path;
    }

    const seller = await Seller.findOne({ where: { userId: req.user.id } });
    await seller.update(updates);

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: seller
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil"
    });
  }
};

// Gestion des clients
export const getCustomers = async (req, res) => {
  try {
    const customers = await Order.findAll({
      where: { sellerId: req.seller.id },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email'],
        where: { role: 'customer' }
      }],
      group: ['User.id'],
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Order.id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('Order.total')), 'totalSpent']
      ]
    });

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des clients"
    });
  }
};

// Gestion des paiements
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { sellerId: req.seller.id },
      include: [{
        model: Order,
        attributes: ['orderNumber']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la r��cupération des paiements"
    });
  }
};

// Statistiques
export const getCustomerStats = async (req, res) => {
  try {
    const stats = await Order.findAll({
      where: { sellerId: req.seller.id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.distinct('userId')), 'totalCustomers'],
        [sequelize.fn('AVG', sequelize.col('total')), 'averageOrderValue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders']
      ]
    });

    res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

// Gestion des commandes
export const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { 
        sellerId: req.seller.id,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'customer',
        attributes: ['name', 'email', 'phone']
      }, {
        model: Product,
        attributes: ['name', 'price']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des commandes"
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      where: { 
        id: orderId,
        sellerId: req.seller.id
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    await order.update({ status });

    // Notifier le client
    await Notification.create({
      userId: order.userId,
      type: 'order_status',
      message: `Votre commande ${order.orderNumber} est maintenant ${status}`,
      metadata: { orderId, status }
    });

    res.status(200).json({
      success: true,
      message: "Statut de la commande mis à jour",
      data: order
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut"
    });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.findAll({
      where: { sellerId: req.seller.id },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalAmount']
      ],
      group: ['status']
    });

    const dailyStats = await Order.findAll({
      where: {
        sellerId: req.seller.id,
        createdAt: {
          [Op.gte]: sequelize.literal('NOW() - INTERVAL \'30 days\'')
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalAmount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))]
    });

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        daily: dailyStats
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

// Gestion des produits
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug'],
      include: [{
        model: Product,
        where: { sellerId: req.seller.id },
        attributes: [],
        required: false
      }],
      group: ['Category.id'],
      having: sequelize.literal('COUNT(Products.id) > 0')
    });

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des catégories"
    });
  }
};

export const bulkUpdateProducts = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { products } = req.body;
    const updates = [];

    for (const product of products) {
      updates.push(
        Product.update(
          {
            price: product.price,
            stock: product.stock,
            status: product.status
          },
          {
            where: {
              id: product.id,
              sellerId: req.seller.id
            },
            transaction
          }
        )
      );
    }

    await Promise.all(updates);
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Produits mis à jour avec succès"
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour des produits"
    });
  }
};

// Gestion des avis
export const getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { sellerId: req.seller.id },
      include: [{
        model: User,
        attributes: ['name', 'avatar']
      }, {
        model: Product,
        attributes: ['name', 'images']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des avis"
    });
  }
};

export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const review = await Review.findOne({
      where: { 
        id,
        sellerId: req.seller.id
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Avis non trouvé"
      });
    }

    await review.update({
      sellerReply: reply,
      sellerReplyDate: new Date()
    });

    res.status(200).json({
      success: true,
      message: "Réponse ajoutée avec succès",
      data: review
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la réponse"
    });
  }
};

// Gestion des retraits et paiements
export const getPaymentStats = async (req, res) => {
  try {
    const stats = await Payment.findAll({
      where: { sellerId: req.seller.id },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalEarnings'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.literal('SUM(CASE WHEN status = \'pending\' THEN amount ELSE 0 END)'), 'pendingAmount']
      ]
    });

    const withdrawals = await Withdrawal.findAll({
      where: { sellerId: req.seller.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0],
        recentWithdrawals: withdrawals
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques de paiement"
    });
  }
};

export const requestWithdrawal = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { amount, bankInfo } = req.body;

    // Vérifier le solde disponible
    const balance = await Payment.sum('amount', {
      where: { 
        sellerId: req.seller.id,
        status: 'completed'
      },
      transaction
    });

    const withdrawnAmount = await Withdrawal.sum('amount', {
      where: { 
        sellerId: req.seller.id,
        status: ['completed', 'pending']
      },
      transaction
    });

    const availableBalance = balance - (withdrawnAmount || 0);

    if (amount > availableBalance) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Solde insuffisant"
      });
    }

    const withdrawal = await Withdrawal.create({
      sellerId: req.seller.id,
      amount,
      bankInfo,
      status: 'pending'
    }, { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Demande de retrait créée avec succès",
      data: withdrawal
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la demande de retrait"
    });
  }
};

// Gestion des promotions
export const createPromotion = async (req, res) => {
  try {
    const {
      name,
      type,
      value,
      startDate,
      endDate,
      productIds,
      minPurchase,
      maxUses
    } = req.body;

    // Vérifier que les produits appartiennent au vendeur
    const products = await Product.findAll({
      where: {
        id: productIds,
        sellerId: req.seller.id
      }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Certains produits n'appartiennent pas à ce vendeur"
      });
    }

    const promotion = await Promotion.create({
      sellerId: req.seller.id,
      name,
      type,
      value,
      startDate,
      endDate,
      minPurchase,
      maxUses,
      remainingUses: maxUses
    });

    await promotion.setProducts(products);

    res.status(201).json({
      success: true,
      message: "Promotion créée avec succès",
      data: promotion
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la promotion"
    });
  }
};

// Gestion des retours
export const handleReturn = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { orderId } = req.params;
    const { status, refundAmount, reason } = req.body;

    const return_ = await Return.findOne({
      where: {
        orderId,
        sellerId: req.seller.id
      },
      transaction
    });

    if (!return_) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Demande de retour non trouvée"
      });
    }

    await return_.update({
      status,
      sellerResponse: reason
    }, { transaction });

    if (status === 'approved') {
      // Créer le remboursement
      await Refund.create({
        returnId: return_.id,
        amount: refundAmount,
        status: 'pending'
      }, { transaction });

      // Mettre à jour le stock si nécessaire
      if (return_.returnItems) {
        for (const item of return_.returnItems) {
          await Product.increment('stock', {
            by: item.quantity,
            where: { id: item.productId },
            transaction
          });
        }
      }
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Retour traité avec succès",
      data: return_
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du traitement du retour"
    });
  }
};

// Gestion des messages et notifications
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { sellerId: req.seller.id },
      include: [{
        model: User,
        attributes: ['name', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages"
    });
  }
};

export const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({
      where: {
        id: messageId,
        sellerId: req.seller.id
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message non trouvé"
      });
    }

    const reply = await Message.create({
      sellerId: req.seller.id,
      userId: message.userId,
      content,
      parentId: messageId
    });

    // Notifier le client
    await Notification.create({
      userId: message.userId,
      type: 'message_reply',
      message: 'Nouvelle réponse à votre message',
      metadata: { messageId: reply.id }
    });

    res.status(201).json({
      success: true,
      message: "Réponse envoyée avec succès",
      data: reply
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la réponse"
    });
  }
};

// ... autres contrôleurs ... 