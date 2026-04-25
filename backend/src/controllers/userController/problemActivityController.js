import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Submission from "../../models/SubmissionModel.js";
import User from "../../models/userModel.js";

const ACCEPTED_STATUS_VALUES = [
  "accepted",
  "Accepted",
  "ACCEPTED",
  "success",
  "Success",
  "SUCCESS",
];

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
  const now = new Date();
  const userId =
    req.user?._id instanceof mongoose.Types.ObjectId
      ? req.user._id
      : new mongoose.Types.ObjectId(String(req.user?._id));

  const startDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  startDate.setUTCDate(startDate.getUTCDate() - 364);

  const activity = await Submission.aggregate([
    {
      $match: {
        user: userId,
        createdAt: {
          $gte: startDate,
          $lte: now,
        },
        $or: [
          { isAccepted: true },
          { status: { $in: ACCEPTED_STATUS_VALUES } },
          { verdict: { $in: ACCEPTED_STATUS_VALUES } },
        ],
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
      },
    },
  ]);

  const totalAcceptedSubmissions = activity.reduce(
    (sum, entry) => sum + (Number(entry.count) || 0),
    0,
  );
  const activeDays = activity.length;

  res.status(200).json({
    success: true,
    activity,
    activities: activity,
    totalAcceptedSubmissions,
    activeDays,
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

