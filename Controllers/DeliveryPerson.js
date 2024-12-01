import User from "../models/User.js";

// Récupérer tous les livreurs
 const getAllDeliveryPersons = async (req, res) => {
  try {
    const deliveryPersons = await User.find();
    res.status(200).json(deliveryPersons);
  } catch (error) {
    console.error("Erreur lors de la récupération des livreurs :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer un livreur par ID
 const getDeliveryPersonById = async (req, res) => {
  try {
    const deliveryPerson = await User.findById(req.params.id).populate("assignedOrders");
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }
    res.status(200).json(deliveryPerson);
  } catch (error) {
    console.error("Erreur lors de la récupération du livreur :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Bloquer un livreur
 const blockDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }
    res.status(200).json({ message: "Livreur bloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du blocage du livreur :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Débloquer un livreur
 const unblockDeliveryPerson = async (req, res) => {
  try {
    const deliveryPerson = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!deliveryPerson) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }
    res.status(200).json({ message: "Livreur débloqué avec succès." });
  } catch (error) {
    console.error("Erreur lors du déblocage du livreur :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Affecter une commande à un livreur
 const assignOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const deliveryPerson = await User.findById(req.params.id);

    if (!deliveryPerson) {
      return res.status(404).json({ message: "Livreur non trouvé." });
    }

    deliveryPerson.assignedOrders.push(orderId);
    await deliveryPerson.save();

    res.status(200).json({ message: "Commande assignée avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'assignation de la commande :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};


export default {getAllDeliveryPersons,getDeliveryPersonById,unblockDeliveryPerson,blockDeliveryPerson,assignOrder}