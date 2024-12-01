import express from "express";
import Restaurant from "../Controllers/Restaurant.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes pour l'e-Restaurant
router.post("/",authMiddleware.authorization, Restaurant.createRestaurantItem);
router.get("/user/get-all", Restaurant.getAllRestaurantItems);
router.get("/:restarantId", Restaurant.getRestaurantItemById);
router.put("/:restarantId",authMiddleware.authorization,Restaurant.updateRestaurantItem);
router.delete("/:restarantId", authMiddleware.authorization,Restaurant.deleteRestaurantItem);

export default router;
