import express from "express";
import DeliveryPerson from "../Controllers/DeliveryPerson";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();


router.get("/get-all", authMiddleware.verifyAdmin,DeliveryPerson.getAllDeliveryPersons); 
router.get("/:id",authMiddleware.verifyAdmin,DeliveryPerson.getDeliveryPersonById); 
router.post("/:id/block", authMiddleware.verifyAdmin,DeliveryPerson.blockDeliveryPerson); 
router.post("/:id/unblock", authMiddleware.verifyAdmin,DeliveryPerson.unblockDeliveryPerson); 
router.post("/:id/assign-order", authMiddleware.verifyAdmin,DeliveryPerson.assignOrder); 

export default router;
