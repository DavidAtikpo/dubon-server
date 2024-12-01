import Service from "../models/Service.js";

// Créer un nouveau service
 const createService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    console.error("Erreur lors de la création du service :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer tous les services
 const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().populate("provider", "name email");
    res.status(200).json(services);
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer un service par ID
 const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate("provider", "name email");
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé." });
    }
    res.status(200).json(service);
  } catch (error) {
    console.error("Erreur lors de la récupération du service :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour un service
 const updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedService) {
      return res.status(404).json({ message: "Service non trouvé." });
    }
    res.status(200).json(updatedService);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du service :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer un service
 const deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) {
      return res.status(404).json({ message: "Service non trouvé." });
    }
    res.status(200).json({ message: "Service supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du service :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

export default {createService,deleteService,getAllServices,getServiceById,updateService}