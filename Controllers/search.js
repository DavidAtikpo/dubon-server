import express from "express";
import { sequelize } from "../models/index.js";
import { Op } from "sequelize";

export const Search = async (req, res) => {
  console.log('Search Controller accessed, query:', req.query);
  
  try {
    const { query } = req.query;
  
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Le paramètre de recherche est requis." });
    }

    console.log('Searching with query:', query);

    const { Product, Event, Training, Service, Restaurant } = sequelize.models;

    // Recherche dans toutes les collections avec une query insensible à la casse
    const [products, events, trainings, services, restaurants] = await Promise.all([
      Product.findAll({
        where: {
          name: {
            [Op.iLike]: `%${query}%`
          }
        },
        attributes: ['id', 'name'],
        limit: 5
      }),

      Event.findAll({
        where: {
          title: {
            [Op.iLike]: `%${query}%`
          }
        },
        attributes: ['id', 'title'],
        limit: 5
      }),

      Training.findAll({
        where: {
          title: {
            [Op.iLike]: `%${query}%`
          }
        },
        attributes: ['id', 'title'],
        limit: 5
      }),

      Service.findAll({
        where: {
          title: {
            [Op.iLike]: `%${query}%`
          }
        },
        attributes: ['id', 'title'],
        limit: 5
      }),

      Restaurant.findAll({
        where: {
          name: {
            [Op.iLike]: `%${query}%`
          }
        },
        attributes: ['id', 'name'],
        limit: 5
      })
    ]);

    // Combinez et formatez les résultats
    const results = [
      ...products.map(p => ({ _id: p.id, title: p.name, type: "product" })),
      ...events.map(e => ({ _id: e.id, title: e.title, type: "event" })),
      ...trainings.map(t => ({ _id: t.id, title: t.title, type: "training" })),
      ...services.map(s => ({ _id: s.id, title: s.title, type: "service" })),
      ...restaurants.map(r => ({ _id: r.id, title: r.name, type: "restaurant" }))
    ];

    console.log('Search results:', results.length);
    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur lors de la recherche :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};
