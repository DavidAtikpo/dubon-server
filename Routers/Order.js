import express from 'express'
import OrderController from '../Controllers/Order.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Routes protégées (nécessitent une authentification)
router.use(protect)

// Créer une nouvelle commande
router.post('/',OrderController.createOrder)

// Obtenir toutes les commandes de l'utilisateur connecté
router.get('/my-orders',OrderController.getOrdersByUserId)

// Obtenir une commande spécifique
router.get('/:id',OrderController.getOrderById)

// Mettre à jour le statut d'une commande
router.patch('/:id/status',OrderController.updateOrderStatus)

export default router