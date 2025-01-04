import express from 'express';
import * as restaurantController from '../Controllers/RestaurantController.js';
import * as serviceController from '../Controllers/ServiceController.js';
import * as trainingController from '../Controllers/TrainingController.js';
import * as eventController from '../Controllers/EventController.js';

const router = express.Router();

// Routes pour les restaurants
router.get('/restaurants/featured', restaurantController.getFeaturedRestaurants);

// Routes pour les services
router.get('/services/featured', serviceController.getFeaturedServices);

// Routes pour les formations
router.get('/trainings/featured', trainingController.getFeaturedTrainings);

// Routes pour les événements
router.get('/events/featured', eventController.getFeaturedEvents);

export default router; 