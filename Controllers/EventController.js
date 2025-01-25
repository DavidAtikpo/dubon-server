import { models } from '../models/index.js';
import { Op } from 'sequelize';

// Créer un nouvel événement
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      date
    } = req.body;

    // Récupérer les URLs des images depuis Cloudinary
    const images = req.files ? req.files.map(file => file.path) : [];

    const event = await models.Event.create({
      sellerId: req.user.id,
      title,
      description,
      type,
      date,
      images
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
    const { status, sort = 'date', order = 'DESC' } = req.query;
    
    // Construction de la clause WHERE
    const whereClause = { sellerId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    // Construction du tri
    const orderOptions = [];
    if (sort === 'date') {
      orderOptions.push(['date', order]);
    } else if (sort === 'title') {
      orderOptions.push(['title', order]);
    } else if (sort === 'createdAt') {
      orderOptions.push(['createdAt', order]);
    }
    orderOptions.push(['id', 'DESC']); // Tri secondaire par ID

    const events = await models.Event.findAll({
      where: whereClause,
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email'],
        include: [{
          model: models.UserProfile,
          as: 'profile',
          attributes: ['firstName', 'lastName']
        }]
      }],
      order: orderOptions
    });

    // Calculer les statistiques
    const now = new Date();
    const stats = {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      upcoming: events.filter(e => new Date(e.date) > now && e.status === 'published').length,
      completed: events.filter(e => e.status === 'completed').length,
      draft: events.filter(e => e.status === 'draft').length
    };

    res.json({
      success: true,
      data: events,
      stats,
      meta: {
        total: events.length,
        sort,
        order
      }
    });
  } catch (error) {
    console.error('Erreur getSellerEvents:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des événements",
      error: error.message
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

    // Gérer les nouvelles images
    let images = event.images || [];
    if (req.files?.length) {
      const newImages = req.files.map(file => file.path);
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

// Supprimer un événement
export const deleteEvent = async (req, res) => {
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

    await event.destroy();

    res.json({
      success: true,
      message: 'Événement supprimé avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Récupérer tous les événements pour les utilisateurs
export const getEvents = async (req, res) => {
  try {
    // Par défaut, on récupère les événements à venir
    const { type = 'all' } = req.query;
    console.log('Type demandé:', type);

    let whereClause = {};

    // Si un type spécifique est demandé
    if (type !== 'all') {
      whereClause.type = type;
      
      // Ajouter la condition de date pour les événements à venir
      if (type === 'upcoming') {
        whereClause.date = {
          [Op.gte]: new Date()
        };
      }
    }

    console.log('Clause WHERE:', JSON.stringify(whereClause));

    // Vérifier d'abord le nombre total d'événements
    const totalEvents = await models.Event.count();
    console.log('Nombre total d\'événements:', totalEvents);

    const events = await models.Event.findAll({
      where: whereClause,
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }],
      order: [
        ['date', 'DESC']
      ]
    });

    console.log('Événements trouvés:', events.length);
    
    if (events.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Aucun événement trouvé',
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Événements récupérés avec succès',
      data: events,
      total: events.length
    });
  } catch (error) {
    console.error('Erreur détaillée:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des événements',
      error: error.message
    });
  }
};

// Récupérer les détails d'un événement
export const getDetailEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await models.Event.findOne({
      where: { id: eventId },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'événement:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des détails de l'événement"
    });
  }
};

export const eventRequest = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      name,
      email,
      phone,
      date,
      guestCount,
      budget,
      specialRequests,
      preferences
    } = req.body;

    // Vérifier si l'événement existe
    const event = await models.Event.findOne({
      where: { id: eventId },
      include: [{
        model: models.User,
        as: 'seller',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement non trouvé"
      });
    }

    // Créer la demande
    const request = await models.EventRequest.create({
      eventId,
      name,
      email,
      phone,
      requestedDate: date,
      guestCount: parseInt(guestCount),
      budget: parseFloat(budget),
      specialRequests,
      preferences,
      status: 'pending'
    });

    // Envoyer une notification au vendeur (à implémenter plus tard)
    // TODO: Implémenter l'envoi d'email au vendeur

    res.status(201).json({
      success: true,
      message: "Votre demande a été envoyée avec succès",
      data: request
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la demande",
      error: error.message
    });
  }
}; 