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
  commitQuizPdfImport,
  createQuiz,
  deleteQuiz,
  getAllQuizzes,
  getQuizById,
  parseQuizPdf,
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
import {
  createProblem,
  createProblemFromJson,
  createProblemsFromJsonBulk,
  deleteProblem,
  getAdminProblems,
  getProblemById,
  previewProblemPdfImport,
  saveProblemPdfImport,
  toggleProblemStatus,
  updateProblem,
  updateProblemFromJson,
} from "../../controllers/adminController/adminProblemController.js";

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
router.post("/quizzes/parse-pdf", uploadQuizPdf.single("file"), parseQuizPdf);
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

// --- Problem Management ---
router.post("/problems", createProblem);
router.post("/problems/json", createProblemFromJson);
router.post("/problems/json/bulk", createProblemsFromJsonBulk);
router.post(
  "/problems/import/pdf/preview",
  uploadQuizPdf.single("file"),
  previewProblemPdfImport,
);
router.post("/problems/import/pdf/save", saveProblemPdfImport);
router.get("/problems", getAdminProblems);
router.get("/problems/:id", getProblemById);
router.put("/problems/:id", updateProblem);
router.put("/problems/:id/json", updateProblemFromJson);
router.delete("/problems/:id", deleteProblem);
router.patch("/problems/:id/status", toggleProblemStatus);

export default router;
