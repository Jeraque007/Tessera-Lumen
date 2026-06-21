import express from "express";
import { getStatus, getQuota, deductQuota } from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/status", getStatus);
router.get("/quota", getQuota);
router.post("/quota", deductQuota);

export default router;
