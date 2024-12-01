import express from 'express'
import Order from '../Controllers/Order.js'

const router = express.Router()

router.post('/',Order.createOrder)
router.get('/user/:id',Order.getOrdersByUserId)
router.get('/:categorie',Order.getOrderByCategory)
router.get('/date',Order.getOrdersByPurchaseDate)

export default router