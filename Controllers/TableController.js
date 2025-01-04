import { models } from '../models/index.js';
import { Op } from 'sequelize';

// Ajouter une table
export const addTable = async (req, res) => {
  try {
    const { restaurantId, number, capacity, location } = req.body;

    // Vérifier que le restaurant appartient au vendeur
    const restaurant = await models.Restaurant.findOne({
      where: {
        id: restaurantId,
        userId: req.user.id
      }
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    const table = await models.Table.create({
      restaurantId,
      number,
      capacity,
      location
    });

    res.status(201).json({
      success: true,
      data: table
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Gérer les réservations
export const createReservation = async (req, res) => {
  try {
    const {
      restaurantId,
      tableId,
      date,
      time,
      guestCount,
      customerName,
      customerPhone,
      customerEmail,
      specialRequests
    } = req.body;

    // Vérifier la disponibilité
    const existingReservation = await models.Reservation.findOne({
      where: {
        tableId,
        date,
        time,
        status: {
          [Op.notIn]: ['cancelled', 'completed']
        }
      }
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'Cette table est déjà réservée pour ce créneau'
      });
    }

    const reservation = await models.Reservation.create({
      restaurantId,
      tableId,
      userId: req.user.id,
      date,
      time,
      guestCount,
      customerName,
      customerPhone,
      customerEmail,
      specialRequests
    });

    // Mettre à jour le statut de la table
    await models.Table.update(
      { status: 'reserved' },
      { where: { id: tableId } }
    );

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les réservations du jour
export const getTodayReservations = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const reservations = await models.Reservation.findAll({
      where: {
        restaurantId,
        date: today,
        status: {
          [Op.notIn]: ['cancelled', 'completed']
        }
      },
      include: [{
        model: models.Table,
        attributes: ['number', 'capacity', 'location']
      }],
      order: [['time', 'ASC']]
    });

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour le statut d'une réservation
export const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;

    const reservation = await models.Reservation.findByPk(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    await reservation.update({ status });

    // Mettre à jour le statut de la table si nécessaire
    if (status === 'completed' || status === 'cancelled') {
      await models.Table.update(
        { status: 'available' },
        { where: { id: reservation.tableId } }
      );
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 