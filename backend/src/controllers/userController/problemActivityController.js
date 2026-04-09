import asyncHandler from "express-async-handler";
import DailyActivity from "../../models/DailyActivityModel.js";
import Submission from "../../models/SubmissionModel.js";
import { getUTCDateKey } from "../../utlis/dayKey.js";
import User from "../../models/UserModel.js";

export const getProblemStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "problemsSolved streak longestStreak lastSolvedDayKey",
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const easySolved = user.problemsSolved?.easy?.length || 0;
  const mediumSolved = user.problemsSolved?.medium?.length || 0;
  const hardSolved = user.problemsSolved?.hard?.length || 0;

  res.status(200).json({
    success: true,
    stats: {
      totalSolved: easySolved + mediumSolved + hardSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      streak: user.streak || 0,
      longestStreak: user.longestStreak || 0,
      lastSolvedDayKey: user.lastSolvedDayKey || null,
    },
  });
});

export const getActivity = asyncHandler(async (req, res) => {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 365);

  const startKey = getUTCDateKey(start);
  const activities = await DailyActivity.find({
    user: req.user._id,
    dayKey: { $gte: startKey },
  })
    .select("dayKey acceptedCount -_id")
    .sort({ dayKey: 1 })
    .lean();

  res.status(200).json({
    success: true,
    activities: activities.map((a) => ({ date: a.dayKey, count: a.acceptedCount })),
  });
});

export const getStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "streak longestStreak lastSolvedDayKey",
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    streak: {
      current: user.streak || 0,
      longest: user.longestStreak || 0,
      lastSolvedDayKey: user.lastSolvedDayKey || null,
    },
  });
});

export const getRecentSubmissions = asyncHandler(async (req, res) => {
  const { limit = "20" } = req.query;
  const limitNum = Math.min(50, Math.max(5, parseInt(limit, 10) || 20));

  const submissions = await Submission.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limitNum)
    .populate("problem", "slug title difficulty")
    .select("problem language status isAccepted runtime memory createdAt")
    .lean();

  res.status(200).json({ success: true, submissions });
});

