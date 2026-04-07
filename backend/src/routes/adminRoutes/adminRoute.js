import express from "express";
import { getAllUsers } from "../../controllers/adminController/userManagement.js";

import {
  createQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
} from "../../controllers/adminController/adminQuizController.js";


import {
  getQuestionsByQuiz,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
} from "../../controllers/adminController/adminQuestionController.js";

import { protect, isAdmin } from "../../middlewares/authMiddleware.js";
import uploadQuiz from "../../middlewares/uploadQuiz.js";

const router = express.Router();

router.use(protect, isAdmin);

// --- User Management ---
router.get("/all-users", getAllUsers);


// --- Quiz Management ---
router.post("/quizzes", uploadQuiz.single("thumbnail"), createQuiz);
router.get("/quizzes", getAllQuizzes);
router.get("/quizzes/:id", getQuizById);
router.put("/quizzes/:id", uploadQuiz.single("thumbnail"), updateQuiz);
router.delete("/quizzes/:id", deleteQuiz);


// --- Question Management ---
router.post("/questions", bulkAddQuestions);
router.get("/questions/quiz/:quizId", getQuestionsByQuiz);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

export default router;
