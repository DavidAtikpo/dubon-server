import { models } from '../models/index.js';
import { sendDisputeNotification } from './NotificationController.js';
import { Op } from 'sequelize';

// Créer un nouveau litige
export const createDispute = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { orderId, reason, message } = req.body;

    // Vérifier si la commande existe
    const order = await models.Order.findOne({
      where: { id: orderId },
      include: [{ model: models.User }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    // Vérifier si un litige existe déjà
    const existingDispute = await models.Dispute.findOne({
      where: { orderId },
      transaction
    });

    if (existingDispute) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Un litige existe déjà pour cette commande"
      });
    }

    // Créer le litige
    const dispute = await models.Dispute.create({
      orderId,
      customerName: order.User.name,
      reason,
      message,
      status: 'pending'
    }, { transaction });

    // Mettre à jour le statut de la commande
    await order.update({
      status: 'disputed'
    }, { transaction });

    await transaction.commit();

    // Envoyer notification au vendeur
    await sendDisputeNotification(dispute.id);

    res.status(201).json({
      success: true,
      message: "Litige créé avec succès",
      data: dispute
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur création litige:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du litige"
    });
  }
};

// Répondre à un litige (vendeur)
export const respondToDispute = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { id } = req.params;
    const { response } = req.body;

    const dispute = await models.Dispute.findOne({
      where: { id },
      include: [{ 
        model: models.Order,
        where: { sellerId: req.seller.id }
      }],
      transaction
    });

    if (!dispute) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Litige non trouvé"
      });
    }

    await dispute.update({
      sellerResponse: response,
      status: 'in_progress'
    }, { transaction });

    await transaction.commit();

    // Notifier le client
    await models.Notification.create({
      userId: dispute.Order.userId,
      type: 'dispute_response',
      message: 'Le vendeur a répondu à votre litige',
      metadata: { disputeId: dispute.id }
    });

    res.status(200).json({
      success: true,
      message: "Réponse enregistrée avec succès",
      data: dispute
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur réponse litige:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la réponse"
    });
  }
};

// Résoudre un litige
export const resolveDispute = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { id } = req.params;
    const { resolution, refundAmount } = req.body;

    const dispute = await models.Dispute.findOne({
      where: { id },
      include: [{ model: models.Order }],
      transaction
    });

    if (!dispute) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Litige non trouvé"
      });
    }

    // Mettre à jour le litige
    await dispute.update({
      resolution,
      status: 'resolved',
      resolvedAt: new Date()
    }, { transaction });

    // Si remboursement nécessaire
    if (refundAmount) {
      await models.Refund.create({
        orderId: dispute.orderId,
        amount: refundAmount,
        reason: 'dispute_resolution',
        status: 'pending'
      }, { transaction });
    }

    // Mettre à jour la commande
    await dispute.Order.update({
      status: 'resolved'
    }, { transaction });

    await transaction.commit();

    // Notifier les deux parties
    await Promise.all([
      models.Notification.create({
        userId: dispute.Order.userId,
        type: 'dispute_resolved',
        message: 'Votre litige a été résolu',
        metadata: { disputeId: dispute.id }
      }),
      models.Notification.create({
        userId: dispute.Order.sellerId,
        type: 'dispute_resolved',
        message: 'Le litige a été résolu',
        metadata: { disputeId: dispute.id }
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Litige résolu avec succès",
      data: dispute
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur résolution litige:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la résolution du litige"
    });
  }
};

// Obtenir les litiges d'un vendeur
export const getSellerDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { 
      userId: req.user.id,
      '$User.role$': 'seller'
    };
    
    if (status) {
      where.status = status;
    }

    const disputes = await models.Dispute.findAndCountAll({
      where,
      include: [{
        model: models.Order,
        include: [{ 
          model: models.User,
          where: { role: 'seller' },
          attributes: ['name', 'email']
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: {
        disputes: disputes.rows,
        total: disputes.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(disputes.count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération litiges:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des litiges"
    });
  }
};

// Obtenir les statistiques des litiges
export const getDisputeStats = async (req, res) => {
  try {
    const stats = await models.Dispute.findAll({
      where: { 
        userId: req.user.id,
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 1))
        }
      },
      include: [{ model: models.Order }],
      attributes: [
        'status',
        [models.sequelize.fn('COUNT', models.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur stats litiges:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques"
    });
  }
};

// Ajouter des preuves à un litige
export const addEvidence = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { disputeId } = req.params;
    const { description } = req.body;
    const files = req.files;

    const dispute = await models.Dispute.findByPk(disputeId, { transaction });
    if (!dispute) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Litige non trouvé"
      });
    }

    const evidences = await Promise.all(
      files.map(file => {
        const type = file.mimetype.startsWith('image/') ? 'photo' :
                    file.mimetype.startsWith('video/') ? 'video' : 'document';
        
        return models.DisputeEvidence.create({
          disputeId,
          type,
          path: file.path,
          description,
          uploadedBy: req.user.id
        }, { transaction });
      })
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Preuves ajoutées avec succès",
      data: evidences
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur ajout preuves:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout des preuves"
    });
  }
};

// Escalader un litige
export const escalateDispute = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const dispute = await models.Dispute.findOne({
      where: { id },
      include: [{ model: models.Order }],
      transaction
    });

    if (!dispute) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Litige non trouvé"
      });
    }

    await dispute.update({
      status: 'escalated',
      resolution: `Escaladé: ${reason}`
    }, { transaction });

    // Notifier l'admin
    await models.Notification.create({
      type: 'dispute_escalated',
      message: `Litige #${dispute.id} escaladé`,
      metadata: {
        disputeId: dispute.id,
        reason
      }
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Litige escaladé avec succès",
      data: dispute
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Erreur escalade litige:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'escalade du litige"
    });
  }
};

// Obtenir l'historique d'un litige
export const getDisputeHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await models.Dispute.findOne({
      where: { id },
      include: [
        { 
          model: models.Order,
          include: [
            { model: models.User, attributes: ['name', 'email'] },
            { model: models.Seller, include: [{ model: models.User, attributes: ['name', 'email'] }] }
          ]
        },
        { model: models.DisputeEvidence },
        { 
          model: models.Notification,
          where: {
            metadata: {
              disputeId: id
            }
          },
          required: false
        }
      ]
    });

    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: "Litige non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: dispute
    });

  } catch (error) {
    console.error('Erreur historique litige:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique"
    });
  }
}; 