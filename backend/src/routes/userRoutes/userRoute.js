import express from "express";
import { loginSchema, registerSchema } from "../../validators/userValidator.js";
import validate from "../../middlewares/validate.js";
import {
  loginUser,
  logoutUser,
  registerUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  verifyEmail,
  googleAuth,
} from "../../controllers/userController/authController.js";

import {
  getProfile,
  getUserById,
  searchUsers,
  toggleFollow,
  updateProfile,
} from "../../controllers/userController/profileController.js";

// Quiz Controllers Import
import {
  getQuizDetails,
  getQuizzes,
  getUserHistory,
  getLeaderboard,
  startQuiz,
  submitQuiz,
  updateQuiz
} from "../../controllers/userController/quizController.js";

// Stats & Leaderboard Controllers Import


import { protect } from "../../middlewares/authMiddleware.js";
import uploadAvatar from "../../middlewares/uploadAvatar.js";
import {
  executeCode,
  getDraft,
  saveDraft,
} from "../../controllers/userController/compilerController.js";
import {
  getProblemStats,
  getActivity,
  getStreak,
  getRecentSubmissions,
} from "../../controllers/userController/problemActivityController.js";
import {
  getActiveUsersCount,
  heartbeat,
} from "../../controllers/userController/presenceController.js";

const router = express.Router();

// --- Auth Routes ---
router.post("/register", validate(registerSchema), registerUser);
router.post("/verify-email", verifyEmail);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/google", googleAuth);

// --- Profile Routes ---
router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadAvatar.single("avatar"), updateProfile);
router.get("/profile/:id", protect, getUserById);
router.get("/search-users", protect, searchUsers);
router.put("/follow/:id", protect, toggleFollow);

// --- Quiz System Routes ---
router.get("/quizzes", protect, getQuizzes);   
router.get("/quizzes/history", protect, getUserHistory);
router.get("/quizzes/leaderboard", protect, getLeaderboard);
router.get("/quizzes/leaderboard/:quizId", protect, getLeaderboard);
router.get("/quizzes/:id", protect, getQuizDetails);
router.get("/quizzes/start/:id", protect, startQuiz); 
router.post("/quizzes/submit", protect, submitQuiz);  
router.put("/update/:id", protect, updateQuiz);

// --- Compiler Routes ---
router.post("/execute", executeCode);
router.post("/save-draft", protect, saveDraft);
router.get("/get-draft", protect, getDraft);

// --- Problems Profile Routes ---
router.get("/profile/problem-stats", protect, getProblemStats);
router.get("/profile/activity", protect, getActivity);
router.get("/profile/streak", protect, getStreak);
router.get("/profile/submissions", protect, getRecentSubmissions);

// --- Presence / Active Users ---
router.patch("/heartbeat", protect, heartbeat);
router.get("/active-count", getActiveUsersCount);

export default router;
