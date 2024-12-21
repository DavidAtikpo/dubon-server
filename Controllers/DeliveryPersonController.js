import { models } from '../models/index.js';
const { DeliveryPerson, Order, User } = models;
import { Op } from 'sequelize';

export const registerDeliveryPerson = async (req, res) => {
  try {
    const {
      vehicleType,
      vehicleNumber,
      licenseNumber,
      zone,
      documents
    } = req.body;

    // Vérifier si l'utilisateur est déjà livreur
    const existingDeliveryPerson = await DeliveryPerson.findOne({
      where: { userId: req.user.id }
    });

    if (existingDeliveryPerson) {
      return res.status(400).json({
        success: false,
        message: "Vous êtes déjà enregistré comme livreur"
      });
    }

    const deliveryPerson = await DeliveryPerson.create({
      userId: req.user.id,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      zone,
      documents,
      status: 'offline'
    });

    // Mettre à jour le rôle de l'utilisateur
    await User.update(
      { role: 'delivery' },
      { where: { id: req.user.id } }
    );

    res.status(201).json({
      success: true,
      data: deliveryPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du livreur",
      error: error.message
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, currentLocation } = req.body;
    const deliveryPerson = await DeliveryPerson.findOne({
      where: { userId: req.user.id }
    });

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Livreur non trouvé"
      });
    }

    await deliveryPerson.update({
      status,
      currentLocation,
      lastActive: new Date()
    });

    res.status(200).json({
      success: true,
      data: deliveryPerson
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message
    });
  }
};

export const getAvailableDeliveryPersons = async (req, res) => {
  try {
    const { zone } = req.query;
    const where = {
      status: 'available'
    };

    if (zone) {
      where.zone = zone;
    }

    const deliveryPersons = await DeliveryPerson.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email', 'phone']
      }]
    });

    res.status(200).json({
      success: true,
      data: deliveryPersons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des livreurs",
      error: error.message
    });
  }
};

export const assignDelivery = async (req, res) => {
  try {
    const { orderId, deliveryPersonId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    const deliveryPerson = await DeliveryPerson.findByPk(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: "Livreur non disponible"
      });
    }

    await Promise.all([
      order.update({ 
        deliveryPersonId,
        status: 'out_for_delivery'
      }),
      deliveryPerson.update({ status: 'busy' })
    ]);

    res.status(200).json({
      success: true,
      message: "Livraison assignée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'assignation de la livraison",
      error: error.message
    });
  }
};

export const getDeliveryPersonStats = async (req, res) => {
  try {
    const deliveryPerson = await DeliveryPerson.findOne({
      where: { userId: req.user.id }
    });

    if (!deliveryPerson) {
      return res.status(404).json({
        success: false,
        message: "Livreur non trouvé"
      });
    }

    const stats = {
      totalDeliveries: deliveryPerson.deliveryCount,
      rating: deliveryPerson.rating,
      // Livraisons du jour
      todayDeliveries: await Order.count({
        where: {
          deliveryPersonId: deliveryPerson.id,
          status: 'delivered',
          updatedAt: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0)
          }
        }
      }),
      // Livraisons en cours
      activeDeliveries: await Order.count({
        where: {
          deliveryPersonId: deliveryPerson.id,
          status: 'out_for_delivery'
        }
      })
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, status, location } = req.body;
    const order = await Order.findOne({
      where: {
        id: orderId,
        deliveryPersonId: req.user.deliveryPersonId
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée"
      });
    }

    await order.update({
      status,
      currentLocation: location
    });

    // Si la livraison est terminée, mettre à jour le statut du livreur
    if (status === 'delivered') {
      await DeliveryPerson.update(
        {
          status: 'available',
          deliveryCount: sequelize.literal('delivery_count + 1')
        },
        { where: { userId: req.user.id } }
      );
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut de livraison",
      error: error.message
    });
  }
}; 