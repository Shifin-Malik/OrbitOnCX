import express from "express";

import {
  getDraft,
  runCode,
  saveDraft,
  submitCode,
} from "../controllers/compilerController.js";
import { optionalProtect, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/run", optionalProtect, runCode);
router.post("/submit", optionalProtect, submitCode);

router.get("/draft/:language", protect, getDraft);
router.post("/draft", protect, saveDraft);

export default router;
