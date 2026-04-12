import express from "express";
import {
  blockUser,
  getAllUsers,
  getUserByIdAdmin,
  getUsers,
  softDeleteUserAdmin,
  unblockUser,
  updateUserRole,
} from "../../controllers/adminController/userManagement.js";
import { getDashboardStats } from "../../controllers/adminController/dashboardController.js";

import {
  bulkCreateQuizzes,
  commitQuizPdfImport,
  createQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizById,
  previewQuizPdfImport,
  toggleQuizStatus,
  updateQuiz,
} from "../../controllers/adminController/adminQuizController.js";


import {
  addQuestionToQuiz,
  getQuestionsByQuiz,
  updateQuestion,
  deleteQuestion,
  bulkAddQuestions,
} from "../../controllers/adminController/adminQuestionController.js";

import { protect, isAdmin } from "../../middlewares/authMiddleware.js";
import uploadQuiz from "../../middlewares/uploadQuiz.js";
import uploadQuizPdf from "../../middlewares/uploadQuizPdf.js";

const router = express.Router();

router.use(protect, isAdmin);

// --- User Management ---
router.get("/users", getUsers);
router.get("/users/:id", getUserByIdAdmin);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/soft-delete", softDeleteUserAdmin);

// Backward-compat
router.get("/all-users", getAllUsers);

// --- Dashboard ---
router.get("/dashboard/stats", getDashboardStats);


// --- Quiz Management ---
router.post("/quizzes", uploadQuiz.single("thumbnail"), createQuiz);
router.get("/quizzes", getAllQuizzes);
router.post("/quizzes/bulk", bulkCreateQuizzes);
router.post(
  "/quizzes/import/pdf/preview",
  uploadQuizPdf.single("file"),
  previewQuizPdfImport,
);
router.post("/quizzes/import/pdf/commit", commitQuizPdfImport);
router.patch("/quizzes/:id/toggle-status", toggleQuizStatus);
router.post("/quizzes/:quizId/questions", addQuestionToQuiz);
router.post("/quizzes/:quizId/questions/bulk", bulkAddQuestions);
router.get("/quizzes/:quizId/questions", getQuestionsByQuiz);
router.get("/quizzes/:id", getQuizById);
router.put("/quizzes/:id", uploadQuiz.single("thumbnail"), updateQuiz);
router.delete("/quizzes/:id", deleteQuiz);


// --- Question Management ---
router.post("/questions", bulkAddQuestions);
router.get("/questions/quiz/:quizId", getQuestionsByQuiz);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);

export default router;
