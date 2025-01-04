import { models } from '../models/index.js';
import { Op } from 'sequelize';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Créer un nouvel événement
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date,
      startTime,
      endTime,
      location,
      capacity,
      price,
      services,
      requirements,
      includedServices,
      additionalServices,
      cancellationPolicy,
      tags
    } = req.body;

    let images = [];
    if (req.files) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
      images = await Promise.all(uploadPromises);
    }

    const event = await models.Event.create({
      sellerId: req.user.id,
      title,
      description,
      type,
      date,
      startTime,
      endTime,
      location,
      capacity,
      price,
      images,
      services,
      requirements,
      includedServices,
      additionalServices,
      cancellationPolicy,
      tags
    });

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur création événement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'événement',
      error: error.message
    });
  }
};

// Obtenir tous les événements d'un vendeur
export const getSellerEvents = async (req, res) => {
  try {
    const events = await models.Event.findAll({
      where: { sellerId: req.user.id },
      include: [{
        model: models.EventBooking,
        as: 'bookings',
        attributes: ['id', 'status']
      }],
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour un événement
export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await models.Event.findOne({
      where: {
        id: eventId,
        sellerId: req.user.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    let images = event.images;
    if (req.files?.length) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
      const newImages = await Promise.all(uploadPromises);
      images = [...images, ...newImages];
    }

    await event.update({
      ...req.body,
      images
    });

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Gérer les réservations
export const createBooking = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      numberOfGuests,
      selectedServices,
      specialRequests,
      contactInfo
    } = req.body;

    const event = await models.Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Vérifier la disponibilité
    const totalBookings = await models.EventBooking.sum('numberOfGuests', {
      where: {
        eventId,
        status: {
          [Op.notIn]: ['cancelled']
        }
      }
    });

    if (totalBookings + numberOfGuests > event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Capacité insuffisante'
      });
    }

    // Calculer le prix total
    const totalPrice = event.price * numberOfGuests;

    const booking = await models.EventBooking.create({
      eventId,
      userId: req.user.id,
      numberOfGuests,
      totalPrice,
      selectedServices,
      specialRequests,
      contactInfo
    });

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour le statut d'une réservation
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const booking = await models.EventBooking.findOne({
      include: [{
        model: models.Event,
        as: 'event',
        where: { sellerId: req.user.id }
      }],
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    await booking.update({ status });

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les statistiques des événements
export const getEventStats = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const stats = await models.Event.findAll({
      where: { sellerId },
      attributes: [
        'type',
        [models.sequelize.fn('count', models.sequelize.col('id')), 'count'],
        [models.sequelize.fn('sum', models.sequelize.col('capacity')), 'totalCapacity'],
        [models.sequelize.fn('avg', models.sequelize.col('price')), 'averagePrice']
      ],
      group: ['type']
    });

    const bookingStats = await models.EventBooking.findAll({
      include: [{
        model: models.Event,
        as: 'event',
        where: { sellerId }
      }],
      attributes: [
        'status',
        [models.sequelize.fn('count', models.sequelize.col('id')), 'count'],
        [models.sequelize.fn('sum', models.sequelize.col('totalPrice')), 'revenue']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        eventStats: stats,
        bookingStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getFeaturedEvents = async (req, res) => {
  try {
    const events = await models.Event.findAll({
      where: {
        date: {
          [Op.gte]: new Date() // Événements à venir uniquement
        },
        availableTickets: {
          [Op.gt]: 0 // Avec des billets disponibles
        }
      },
      limit: 6,
      order: [['date', 'ASC']]
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements'
    });
  }
}; 