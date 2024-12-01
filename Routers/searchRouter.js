import express from 'express'
// import search from '../Controllers/search.js'

import  searchController from "../Controllers/search.js";

const router = express.Router();

router.get("/search", searchController.Search);



export default router
