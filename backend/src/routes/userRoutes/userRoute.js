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

import { protect } from "../../middlewares/authMiddleware.js";

import uploadAvatar from "../../middlewares/uploadAvatar.js";
import { executeCode, getDraft, saveDraft } from "../../controllers/userController/compilerController.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);

router.post("/verify-email", verifyEmail);

router.post("/login", validate(loginSchema), loginUser);

router.post("/logout", logoutUser);

router.post("/refresh-token", refreshAccessToken);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);

router.put("/profile", protect, uploadAvatar.single("avatar"), updateProfile);

router.get("/search-users", protect, searchUsers);

router.put("/follow/:id", protect, toggleFollow);

router.get("/profile/:id", protect, getUserById);

router.post("/google", googleAuth);

router.post("/execute", executeCode);

router.post("/save-draft", saveDraft);
router.get("/get-draft", getDraft);

export default router;
