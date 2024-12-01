import express from 'express'
import Product from '../models/Products.js';

const router = express.Router()

router.get("/get-by-category", async (req, res) => {
    const { category } = req.query;
    try {
      const products = await Product.find({ category });
      res.status(200).json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur lors de la récupération des produits" });
    }
  });
  

  export default router