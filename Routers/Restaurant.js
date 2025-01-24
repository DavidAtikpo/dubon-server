import express from "express";
import { protect, seller } from "../middleware/authMiddleware.js";
import * as restaurantController from "../Controllers/RestaurantController.js";
import * as orderController from "../Controllers/OrderController.js";
import * as tableController from "../Controllers/TableController.js";
import * as dishController from "../Controllers/DishController.js";
import uploadRestaurant from "../middleware/uploadRestaurant.js";
import upload from "../middleware/uploadDish.js";
import Restaurant from "../Controllers/Restaurant.js";

const router = express.Router();

// Routes publiques
router.get("/", restaurantController.getAllRestaurants);
router.get("/restaurant/:id", restaurantController.getRestaurantById);
router.get("/search", restaurantController.searchRestaurants);
router.get("/:restaurantId/dishes", dishController.getRestaurantDishes);

// Routes protégées pour les vendeurs
router.use(protect);
router.use(seller);

// Routes pour le restaurant
router.get("/seller/restaurants", restaurantController.getSellerRestaurants);

router.post("/add", uploadRestaurant, async (req, res, next) => {
  try {
    console.log('User dans la requête:', req.user);
    await Restaurant.addRestaurant(req, res);
  } catch (error) {
    console.error('Erreur dans la route /add:', error);
    next(error);
  }
});

router.put("/:id", 
  uploadRestaurant,
  restaurantController.updateRestaurant
);
router.delete("/:id", restaurantController.deleteRestaurant);

// Routes pour les plats
router.post("/:restaurantId/dishes", 
  upload.single("image"),
  dishController.addDish
);

// Routes pour les commandes
router.get('/:restaurantId/orders', orderController.getRestaurantOrders);
router.put('/orders/:orderId', orderController.updateOrderStatus);
router.get('/:restaurantId/stats', orderController.getOrderStats);

// Routes pour les tables
router.post('/:restaurantId/tables', tableController.addTable);
// router.get('/:restaurantId/tables', tableController.getTables);
// router.put('/:restaurantId/tables/:tableId', tableController.updateTable);

// Routes pour les réservations
router.post('/:restaurantId/reservations', tableController.createReservation);
router.get('/:restaurantId/reservations/today', tableController.getTodayReservations);
// router.get('/:restaurantId/reservations', tableController.getReservations);
router.put('/reservations/:reservationId', tableController.updateReservationStatus);

export default router;
