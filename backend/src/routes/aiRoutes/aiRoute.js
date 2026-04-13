import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { chatWithAi } from "../../controllers/aiController/aiController.js";

const router = express.Router();

router.post("/chat", protect, chatWithAi);

export default router;

