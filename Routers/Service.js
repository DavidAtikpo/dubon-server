import express from "express";
import Service from "../Controllers/Service.js";
const router = express.Router();


router.post("/", Service.createService);
router.get("/get-all", Service.getAllServices);
router.get("/:serviceId", Service.getServiceById);
router.put("/:serviceId", Service.updateService);
router.delete("/:serviceId", Service.deleteService);

export default router;
