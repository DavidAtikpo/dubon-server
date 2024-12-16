import { models } from '../models/index.js';
const { Service, User } = models;

export const createService = async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceData = {
      ...req.body,
      providerId: userId
    };

    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      message: "Service créé avec succès",
      data: service
    });
  } catch (error) {
    console.error('Erreur lors de la création du service:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du service",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getServices = async (req, res) => {
  try {
    const { category, available } = req.query;
    const where = {};

    if (category) {
      where.category = category;
    }
    if (available !== undefined) {
      where.availability = available === 'true';
    }

    const services = await Service.findAll({
      where,
      include: [{
        model: User,
        attributes: ['name', 'email']
      }]
    });

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des services:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services"
    });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }

    await service.update(req.body);

    res.status(200).json({
      success: true,
      message: "Service mis à jour avec succès",
      data: service
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du service:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du service"
    });
  }
};