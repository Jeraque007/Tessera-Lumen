import express from "express";
import { initiate, notify, getStatus, relay } from "../controllers/payfastController.js";

const router = express.Router();

router.post("/initiate", initiate);
router.post("/notify", notify);
router.get("/status", getStatus);
router.get("/relay", relay);

export default router;
