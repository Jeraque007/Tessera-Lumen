import express from "express";
import { getStatus, verifyHuawei } from "../controllers/paymentController.js";

const router = express.Router();

router.get("/status", getStatus);
router.post("/huawei/verify", verifyHuawei);

export default router;
