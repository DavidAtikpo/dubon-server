import express from 'express'
import { Search } from "../Controllers/search.js";

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log('Search Route accessed:', req.method, req.url);
  next();
});

// Route de recherche globale
router.get("/", Search);

export default router
