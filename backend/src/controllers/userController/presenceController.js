import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";

const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

const getCutoffDate = () => new Date(Date.now() - ACTIVE_WINDOW_MS);

export const heartbeat = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401);
    throw new Error("Not authorized");
  }

  await User.updateOne({ _id: userId }, { $set: { lastSeenAt: new Date() } });

  // Optional real-time update if Socket.IO is initialized.
  const io = req.app.get("io");
  if (io) {
    const activeUsers = await User.countDocuments({
      lastSeenAt: { $gte: getCutoffDate() },
    });
    io.emit("app:active-users", { activeUsers });
  }

  res.status(200).json({ success: true });
});

export const getActiveUsersCount = asyncHandler(async (req, res) => {
  const activeUsers = await User.countDocuments({
    lastSeenAt: { $gte: getCutoffDate() },
  });

  res.status(200).json({
    success: true,
    activeUsers,
  });
});

