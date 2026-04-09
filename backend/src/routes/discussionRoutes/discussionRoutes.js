import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import {
  listDiscussions,
  createComment,
  replyToComment,
  deleteDiscussion,
} from "../../controllers/discussionController/problemDiscussionController.js";

const router = express.Router();

router.use(protect);

router.get("/problems/:problemId/discussions", listDiscussions);
router.post("/problems/:problemId/discussions", createComment);
router.post("/problems/:problemId/discussions/:commentId/reply", replyToComment);

router.delete("/discussions/:commentId", deleteDiscussion);

export default router;

