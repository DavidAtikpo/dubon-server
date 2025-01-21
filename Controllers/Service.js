import { models } from '../models/index.js';

const { Service, User, ServiceRequest } = models;

const createService = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, subCategory } = req.body;
    let images = [];

    // Gérer les fichiers uploadés localement
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path.replace(/\\/g, '/'));
    }

    // Créer le service avec les données de base
    const serviceData = {
      providerId: userId,
      category,
      subCategory,
      title: `Service de ${subCategory}`,
      description: `Service professionnel de ${subCategory}`,
      images,
      status: 'active'
    };

    console.log('Service data to create:', serviceData);

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

const getServices = async (req, res) => {
  try {
    console.log('User requesting services:', {
      userId: req.user.id,
      userRole: req.user.role
    });

    const services = await Service.findAll({
      where: {
        providerId: req.user.id
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'description', 'category', 'subCategory', 'images', 'status', 'createdAt']
    });

    console.log(`Found ${services.length} services for user ${req.user.id}`);
    
    if (services.length === 0) {
      console.log('No services found for user');
    } else {
      console.log('First service:', services[0]);
    }

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des services:', {
      error: error.message,
      stack: error.stack,
      userId: req?.user?.id
    });
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findByPk(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du service:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du service"
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    console.log('Updating service:', serviceId);
    const service = await Service.findByPk(serviceId);

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

const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findByPk(serviceId);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service non trouvé"
      });
    }

    await service.destroy();

    res.status(200).json({
      success: true,
      message: "Service supprimé avec succès"
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du service:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du service"
    });
  }
};

const getPublicServices = async (req, res) => {
  try {
    console.log('Fetching public services...');
    
    // D'abord, vérifions tous les services sans filtre
    const allServices = await Service.findAll();
    console.log('Total services in database:', allServices.length);

    // Maintenant la requête filtrée
    const services = await Service.findAll({
      where: {
        status: 'active'
      },
      include: [{
        model: User,
        as: 'provider',
        attributes: ['id', 'name', 'avatar', 'phone']
      }],
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 
        'title',
        'description',
        'category', 
        'subCategory', 
        'images',
        'status',
        'createdAt'
      ]
    });

    console.log('Found active services:', services.length);
    
    if (services.length === 0) {
      // Si aucun service actif, renvoyons tous les services
      const formattedServices = allServices.map(service => ({
        _id: service.id,
        title: service.title || 'Sans titre',
        description: service.description || 'Pas de description',
        category: service.category || 'Général',
        icon: 'FaTools',
        availability: service.status || 'available',
        images: service.images || [],
        subCategory: service.subCategory || 'Général',
        createdAt: service.createdAt
      }));

      console.log('Returning all services instead:', formattedServices.length);
      
      return res.status(200).json({
        success: true,
        data: formattedServices
      });
    }

    // Formater les services actifs
    const formattedServices = services.map(service => {
      const plainService = service.get({ plain: true });
      return {
        _id: plainService.id,
        title: plainService.title || 'Sans titre',
        description: plainService.description || 'Pas de description',
        category: plainService.category || 'Général',
        icon: 'FaTools',
        availability: plainService.status === 'active' ? 'available' : 'busy',
        provider: plainService.provider,
        images: plainService.images || [],
        subCategory: plainService.subCategory || 'Général',
        createdAt: plainService.createdAt
      };
    });

    console.log('Formatted active services:', formattedServices.length);

    res.status(200).json({
      success: true,
      data: formattedServices
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la récupération des services publics:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des services publics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const serviceRequest = async (req, res) => {
  try {
    const {
      serviceType,
      description,
      location,
      preferredDate,
      preferredTime,
      urgency,
      contactName,
      contactPhone,
      contactEmail
    } = req.body;

    // Validation des champs requis
    if (!serviceType || !description || !location || !preferredDate || !preferredTime || !contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires'
      });
    }

    // Créer la demande de service dans la base de données
    const serviceRequest = await ServiceRequest.create({
      serviceType,
      description,
      location,
      preferredDate,
      preferredTime,
      urgency: urgency || 'normal',
      contactName,
      contactPhone,
      contactEmail,
      status: 'pending'
    });

    // Envoyer une réponse de succès
    return res.status(201).json({
      success: true,
      message: 'Demande de service envoyée avec succès',
      data: serviceRequest
    });

  } catch (error) {
    console.error('Erreur lors de la création de la demande de service:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la demande de service'
    });
  }
};

export default {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getPublicServices,
  serviceRequest
};