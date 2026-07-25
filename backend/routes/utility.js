import express from "express";
import { getLanguages, translate } from "../controllers/utilityController.js";

const router = express.Router();

router.get("/languages", getLanguages);
router.post("/translate", translate);

export default router;
