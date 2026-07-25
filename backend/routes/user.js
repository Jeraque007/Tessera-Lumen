import express from "express";
import { syncCRM } from "../controllers/userController.js";

const router = express.Router();

router.post("/crm", syncCRM);

export default router;
