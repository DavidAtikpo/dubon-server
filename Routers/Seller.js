import express from "express";
import Seller from "../Controllers/Seller.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/seller/register", Seller.sellerSubscrition)
router.post("/:id/start-trial", Seller.startFreeTrial);
router.get("/:id/trial-status", Seller.checkTrialStatus);
router.post("/:id/pay-subscription", Seller.paySubscription);

router.get('/sellers',authMiddleware.verifyAdmin,Seller.getAllSellers);
router.get("/seller/:id",authMiddleware.verifyAdmin,Seller.getSellerById);
router.post('/sellers/:id/block',authMiddleware.verifyAdmin,Seller.blockSeller);
router.post('/sellers/:id/unblock',authMiddleware.verifyAdmin,Seller.unblockSeller);

export default router;
