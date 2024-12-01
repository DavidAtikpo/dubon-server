import express from "express";
import Admin from "../Controllers/Admin.js";
import Products from "../Controllers/Products.js";
import User from "../Controllers/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router= express.Router();
//Order managment routes
router.get('/getorders',Admin.getOrders);
router.delete('/deleteorder:orderId',Admin.deleteOrder);
//product managment routes

// Seller manegment routes

// user managment routes
router.get('/getuser',Admin.getUsers);
router.get('/info',Admin.userInfo)
router.put('/users/:id',User.blockUser);
router.delete('/user-delete',User.deleteUserById);
router.put('/user-unlck',User.unblockUser)

export default router