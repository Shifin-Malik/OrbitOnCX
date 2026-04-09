import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Problem from "../../models/ProblemModel.js";
import ProblemDiscussion from "../../models/ProblemDiscussionModel.js";

const buildTree = (comments) => {
  const byId = new Map();
  const roots = [];
  comments.forEach((c) => {
    byId.set(c._id.toString(), { ...c, replies: [] });
  });
  comments.forEach((c) => {
    const node = byId.get(c._id.toString());
    if (c.parentComment) {
      const parent = byId.get(c.parentComment.toString());
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
};

export const listDiscussions = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    res.status(400);
    throw new Error("Invalid problemId");
  }

  const exists = await Problem.findById(problemId).select("_id").lean();
  if (!exists) {
    res.status(404);
    throw new Error("Problem not found");
  }

  const comments = await ProblemDiscussion.find({ problem: problemId })
    .sort({ createdAt: 1 })
    .populate("user", "name avatar")
    .lean();

  res.status(200).json({
    success: true,
    comments: buildTree(comments),
  });
});

export const createComment = asyncHandler(async (req, res) => {
  const { problemId } = req.params;
  const { content } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    res.status(400);
    throw new Error("Invalid problemId");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400);
    throw new Error("content is required");
  }

  const exists = await Problem.findById(problemId).select("_id").lean();
  if (!exists) {
    res.status(404);
    throw new Error("Problem not found");
  }

  const created = await ProblemDiscussion.create({
    problem: problemId,
    user: req.user._id,
    parentComment: null,
    content: content.trim(),
  });

  const populated = await ProblemDiscussion.findById(created._id)
    .populate("user", "name avatar")
    .lean();

  const io = req.app.get("io");
  if (io) io.to(`discussion:${problemId}`).emit("discussion:new-comment", populated);

  res.status(201).json({ success: true, comment: populated });
});

export const replyToComment = asyncHandler(async (req, res) => {
  const { problemId, commentId } = req.params;
  const { content } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    res.status(400);
    throw new Error("Invalid problemId");
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    res.status(400);
    throw new Error("Invalid commentId");
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400);
    throw new Error("content is required");
  }

  const parent = await ProblemDiscussion.findById(commentId).select("problem").lean();
  if (!parent) {
    res.status(404);
    throw new Error("Parent comment not found");
  }
  if (parent.problem.toString() !== problemId.toString()) {
    res.status(400);
    throw new Error("Comment does not belong to this problem");
  }

  const created = await ProblemDiscussion.create({
    problem: problemId,
    user: req.user._id,
    parentComment: commentId,
    content: content.trim(),
  });

  const populated = await ProblemDiscussion.findById(created._id)
    .populate("user", "name avatar")
    .lean();

  const io = req.app.get("io");
  if (io) io.to(`discussion:${problemId}`).emit("discussion:new-reply", populated);

  res.status(201).json({ success: true, reply: populated });
});

export const deleteDiscussion = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    res.status(400);
    throw new Error("Invalid commentId");
  }

  const comment = await ProblemDiscussion.findById(commentId).select("user problem").lean();
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not allowed to delete this comment");
  }

  await Promise.all([
    ProblemDiscussion.deleteMany({ parentComment: commentId }),
    ProblemDiscussion.deleteOne({ _id: commentId }),
  ]);

  const io = req.app.get("io");
  if (io) io.to(`discussion:${comment.problem.toString()}`).emit("discussion:deleted", { _id: commentId });

  res.status(200).json({ success: true, message: "Comment deleted" });
});

