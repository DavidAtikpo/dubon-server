import RestaurantItem from "../models/RestaurantItem.js";

// Créer un nouvel article du restaurant
 const createRestaurantItem = async (req, res) => {
  try {
    const newItem = new RestaurantItem(req.body);
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error("Erreur lors de la création de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer tous les articles du restaurant
 const getAllRestaurantItems = async (req, res) => {
  try {
    const items = await RestaurantItem.find();
    res.status(200).json(items);
  } catch (error) {
    console.error("Erreur lors de la récupération des articles :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Récupérer un article par ID
 const getRestaurantItemById = async (req, res) => {
  try {
    const item = await RestaurantItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Mettre à jour un article du restaurant
 const updateRestaurantItem = async (req, res) => {
  try {
    const updatedItem = await RestaurantItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

// Supprimer un article du restaurant
 const deleteRestaurantItem = async (req, res) => {
  try {
    const deletedItem = await RestaurantItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Article non trouvé." });
    }
    res.status(200).json({ message: "Article supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'article :", error);
    res.status(500).json({ message: "Erreur du serveur." });
  }
};

export default {createRestaurantItem,deleteRestaurantItem,updateRestaurantItem,getRestaurantItemById,getAllRestaurantItems}