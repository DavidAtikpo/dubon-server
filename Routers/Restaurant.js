import express from "express";
import { protect, seller } from "../middleware/authMiddleware.js";
import * as restaurantController from "../Controllers/RestaurantController.js";
import * as orderController from "../Controllers/OrderController.js";
import * as tableController from "../Controllers/TableController.js";
import * as dashboardController from '../Controllers/RestaurantDashboardController.js';
import * as dishController from "../Controllers/DishController.js";



const router = express.Router();


// Routes publiques
router.get("/", restaurantController.getAllRestaurants);
router.get("/:id", restaurantController.getRestaurantById);
router.get("/search", restaurantController.searchRestaurants);

// Routes protégées pour les vendeurs
router.use(protect, seller);

// Routes pour le restaurant
router.post("/", 
  restaurantController.upload.single("image"),
  restaurantController.addRestaurant
);
router.put("/:id", 
  restaurantController.upload.single("image"),
  restaurantController.updateRestaurant
);
router.delete("/:id", restaurantController.deleteRestaurant);

// Routes pour les commandes
router.get('/:restaurantId/orders', orderController.getRestaurantOrders);
router.put('/orders/:orderId', orderController.updateOrderStatus);
router.get('/:restaurantId/stats', orderController.getOrderStats);

// Routes pour les tables
router.post('/:restaurantId/tables', tableController.addTable);
router.get('/:restaurantId/tables', async (req, res) => {
  try {
    const tables = await models.Table.findAll({
      where: { restaurantId: req.params.restaurantId }
    });
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/:restaurantId/tables/:tableId', async (req, res) => {
  try {
    const { status, capacity, location } = req.body;
    await models.Table.update(
      { status, capacity, location },
      { where: { id: req.params.tableId, restaurantId: req.params.restaurantId } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Routes pour les réservations
router.post('/:restaurantId/reservations', tableController.createReservation);
router.get('/:restaurantId/reservations/today', tableController.getTodayReservations);
router.get('/:restaurantId/reservations', async (req, res) => {
  try {
    const { date } = req.query;
    const reservations = await models.Reservation.findAll({
      where: {
        restaurantId: req.params.restaurantId,
        ...(date && { date })
      },
      include: [{
        model: models.Table,
        attributes: ['number', 'capacity', 'location']
      }],
      order: [['date', 'ASC'], ['time', 'ASC']]
    });
    res.json({ success: true, data: reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/reservations/:reservationId', tableController.updateReservationStatus);

// Routes pour le tableau de bord
router.get('/:restaurantId/dashboard', protect, seller, dashboardController.getDashboardStats);
router.get('/:restaurantId/sales-stats', protect, seller, dashboardController.getSalesStats);

// Routes pour les plats
router.post("/dishes", 
  protect,
  seller,
  dishController.upload.single("image"),
  dishController.addDish
);

router.get("/dishes/categories", dishController.getDishCategories);
router.get("/:restaurantId/dishes", dishController.getRestaurantDishes);

export default router;
