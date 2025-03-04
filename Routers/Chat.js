import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ChatController from "../Controllers/ChatController.js";

const router = express.Router();

router.use(protect);

router.get("/user", ChatController.getUserConversations);
router.get("/seller", ChatController.getSellerConversations);

router.get("/messages/seller/:userId", ChatController.getMessages);
router.get("/messages/user/:sellerId", ChatController.getMessages);
router.post("/send", ChatController.sendMessage);


export default router;

