import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import Problem from "../../models/ProblemModel.js";
import Quiz from "../../models/QuizModel.js";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; 
const getCutoffDate = () => new Date(Date.now() - ACTIVE_WINDOW_MS);

export const getDashboardStats = asyncHandler(async (req, res) => {
  const cutoff = getCutoffDate();

  const [totalUsers, activeUsers, totalProblems, totalQuizzes] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ lastSeenAt: { $gte: cutoff } }),
      Problem.countDocuments({}),
      Quiz.countDocuments({}),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      activeUsers,
      totalProblems,
      totalQuizzes,
    },
  });
});

