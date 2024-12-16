import express from "express";
// import router = express.Router();
import Product from "../models/Products.js";
import Event from "../models/Event.js";
// import Training from "../models/Training.js";

// Route de recherche

const Search = async (req, res) => {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ message: "Le paramètre de recherche est requis." });
    }
  
    try {
      // Recherchez dans les trois collections avec une query insensible à la casse
      const products = await Product.find(
        { title: { $regex: query, $options: "i" } },
        { _id: 1, title: 1 } // Limitez les champs retournés
      );
  
      const events = await Event.find(
        { title: { $regex: query, $options: "i" } },
        { _id: 1, title: 1 }
      );
  
      const trainings = await Training.find(
        { title: { $regex: query, $options: "i" } },
        { _id: 1, title: 1 }
      );
  
      // Combinez les résultats
      const results = [
        ...products.map((p) => ({ ...p.toObject(), type: "product" })),
        ...events.map((e) => ({ ...e.toObject(), type: "event" })),
        ...trainings.map((t) => ({ ...t.toObject(), type: "training" }))
      ];
  
      res.status(200).json(results);
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  };
  

export default {Search}
