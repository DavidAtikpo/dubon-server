import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ChatController from "../Controllers/ChatController.js";

const router = express.Router();

// Protect all routes
router.use(protect);

// User routes
router.get("/user/conversations", ChatController.getUserConversations);
router.get("/user/messages/:sellerId", ChatController.getMessages);

// Seller routes
router.get("/seller/conversations", ChatController.getSellerConversations);
router.get("/seller/messages/:userId", ChatController.getMessages);

// Common routes
router.post("/send", ChatController.sendMessage);

// Admin routes
router.get("/admin/conversations", ChatController.getAdminConversations);
router.get("/admin/messages/:sellerId/:userId", ChatController.getAdminMessages);

export default router; 





// import express from "express";
// import { protect } from "../middleware/authMiddleware.js";
// import * as ChatController from "../Controllers/ChatController.js";

// const router = express.Router();

// router.use(protect);

// router.get("/user", ChatController.getUserConversations);
// router.get("/seller", ChatController.getSellerConversations);

// router.get("/messages/seller/:userId", ChatController.getMessages);
// router.get("/messages/user/:sellerId", ChatController.getMessages);
// router.post("/send", ChatController.sendMessage);


// export default router;