import User from "../models/userModel.js";
import DailyActivity from "../models/DailyActivityModel.js";
import { getUTCDateKey, getUTCYesterdayKey } from "../utlis/dayKey.js";

export const applyAcceptedSolve = async ({ userId, problemId, difficulty }) => {
  const now = new Date();
  const todayKey = getUTCDateKey(now);
  const yesterdayKey = getUTCYesterdayKey(now);

  const user = await User.findById(userId).select(
    "streak longestStreak lastSolvedDayKey problemsSolved lastActivity",
  );
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  await DailyActivity.findOneAndUpdate(
    { user: userId, dayKey: todayKey },
    {
      $inc: { acceptedCount: 1 },
      $addToSet: { solvedProblemIds: problemId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const safeDifficulty =
    difficulty === "Easy" ? "easy" : difficulty === "Medium" ? "medium" : "hard";

  // Mark solved (idempotent)
  user.problemsSolved = user.problemsSolved || { easy: [], medium: [], hard: [] };
  const solvedArr = user.problemsSolved[safeDifficulty] || [];
  const alreadySolved = solvedArr.some((id) => id.toString() === problemId.toString());
  if (!alreadySolved) {
    user.problemsSolved[safeDifficulty] = [...solvedArr, problemId];
  }

  // Streak logic: increment at most once per dayKey
  const lastKey = user.lastSolvedDayKey || null;
  if (lastKey !== todayKey) {
    if (lastKey === yesterdayKey) user.streak = (user.streak || 0) + 1;
    else user.streak = 1;
    user.longestStreak = Math.max(user.longestStreak || 0, user.streak || 0);
    user.lastSolvedDayKey = todayKey;
  }

  user.lastActivity = now;
  await user.save({ validateBeforeSave: false });

  return {
    todayKey,
    streak: user.streak || 0,
    longestStreak: user.longestStreak || 0,
  };
};

