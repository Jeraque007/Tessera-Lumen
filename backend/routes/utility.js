import express from "express";
import { getLanguages, translate, checkFreeReading, claimFreeReading } from "../controllers/utilityController.js";

const router = express.Router();

router.get("/languages", getLanguages);
router.get("/free-check", checkFreeReading);
router.post("/free-claim", claimFreeReading);
router.post("/translate", translate);

export default router;
