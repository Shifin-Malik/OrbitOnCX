import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../../models/userModel.js";
import {
  getOnlineUserIds,
  getUsersOnlineState,
} from "../../services/presenceService.js";
import {
  sendUserBlockedEmail,
  sendUserUnblockedEmail,
} from "../../services/mail/userStatusEmails.js";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const buildUserMatch = ({
  search,
  role,
  status,
  excludeUserId,
  onlineUserIds,
}) => {
  const match = {};

  if (excludeUserId) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
  }

  if (role && role !== "all") {
    match.role = role;
  }

  if (status && status !== "all") {
    const normalized = String(status).toLowerCase();
    if (normalized === "deleted") match.isDeleted = true;
    if (normalized === "active") {
      match.isDeleted = { $ne: true };
      match.isBlocked = false;
    }
    if (normalized === "blocked") {
      match.isDeleted = { $ne: true };
      match.isBlocked = true;
    }
    if (normalized === "online" && Array.isArray(onlineUserIds)) {
      match.isDeleted = { $ne: true };
      match.isBlocked = false;
      match._id = match._id
        ? {
            ...match._id,
            $in: onlineUserIds.map((id) => new mongoose.Types.ObjectId(id)),
          }
        : { $in: onlineUserIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }
  }

  if (search && String(search).trim()) {
    const safe = escapeRegex(String(search).trim());
    const regex = new RegExp(safe, "i");
    match.$or = [{ name: regex }, { email: regex }];
  }

  return match;
};

const resolveSort = (sortBy) => {
  const normalized = String(sortBy || "newest").toLowerCase();
  if (normalized === "oldest") return { createdAt: 1, _id: 1 };
  if (normalized === "recentlyactive" || normalized === "mostrecentlyactive") {
    return { lastSeenAt: -1, createdAt: -1, _id: -1 };
  }
  return { createdAt: -1, _id: -1 };
};

const listUsersAggregation = async ({ match, sort, page, limit }) => {
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: match },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
    {
      $addFields: {
        followersCount: { $size: { $ifNull: ["$followers", []] } },
        followingCount: { $size: { $ifNull: ["$following", []] } },
        easyCount: {
          $size: { $ifNull: ["$problemsSolved.easy", []] },
        },
        mediumCount: {
          $size: { $ifNull: ["$problemsSolved.medium", []] },
        },
        hardCount: {
          $size: { $ifNull: ["$problemsSolved.hard", []] },
        },
      },
    },
    {
      $addFields: {
        solvedQuestions: { $add: ["$easyCount", "$mediumCount", "$hardCount"] },
        status: {
          $cond: [
            { $eq: ["$isDeleted", true] },
            "Deleted",
            { $cond: [{ $eq: ["$isBlocked", true] }, "Blocked", "Active"] },
          ],
        },
        lastLogin: { $ifNull: ["$lastSeenAt", "$createdAt"] },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        role: 1,
        status: 1,
        isDeleted: 1,
        isBlocked: 1,
        blockedAt: 1,
        deletedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        lastLogin: 1,
        followersCount: 1,
        followingCount: 1,
        solvedQuestions: 1,
        easyCount: 1,
        mediumCount: 1,
        hardCount: 1,
        quizScore: 1,
        streak: 1,
        lastSeenAt: 1,
      },
    },
  ];

  return User.aggregate(pipeline);
};

// New: GET /api/admin/users?page=&limit=&search=&role=&status=&sortBy=
export const getUsers = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = Math.min(parsePositiveInt(req.query.limit, 10), 100);
  const search = req.query.search || "";
  const role = req.query.role || "all";
  const status = req.query.status || "all";
  const sortBy = req.query.sortBy || "newest";

  let onlineUserIds = null;
  if (String(status).toLowerCase() === "online") {
    try {
      onlineUserIds = await getOnlineUserIds();
    } catch (e) {
      onlineUserIds = [];
    }
  }

  const match = buildUserMatch({
    search,
    role,
    status,
    excludeUserId: req.user?._id,
    onlineUserIds,
  });
  const sort = resolveSort(sortBy);

  const [users, totalUsers] = await Promise.all([
    listUsersAggregation({ match, sort, page, limit }),
    User.countDocuments(match),
  ]);

  let onlineStates = {};
  try {
    onlineStates = await getUsersOnlineState(users.map((u) => u._id));
  } catch (e) {
    onlineStates = {};
  }
  const hydrated = users.map((u) => {
    const state = onlineStates[String(u._id)] || { isOnline: false };
    const isOnline = Boolean(state.isOnline);
    const statusValue = u.isDeleted
      ? "Deleted"
      : u.isBlocked
        ? "Blocked"
        : isOnline
          ? "Online"
          : "Active";

    return {
      ...u,
      isOnline,
      status: statusValue,
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  res.status(200).json({
    success: true,
    users: hydrated,
    pagination: {
      page,
      limit,
      totalUsers,
      totalPages,
    },
  });
});


export const getAllUsers = asyncHandler(async (req, res) => {
  return getUsers(req, res);
});

export const getUserByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const userAggregation = await User.aggregate([
    { 
      $match: { _id: new mongoose.Types.ObjectId(id) } 
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        avatar: 1,
        role: 1,
        isBlocked: 1,
        blockedAt: 1,
        isDeleted: 1,
        deletedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        lastSeenAt: 1,
        quizScore: 1,
        streak: 1,
        totalXp: 1,
        bio: 1,
        socialLinks: 1,
        
        followersCount: { $size: { $ifNull: ["$followers", []] } },
        followingCount: { $size: { $ifNull: ["$following", []] } },
        easyCount: { $size: { $ifNull: ["$problemsSolved.easy", []] } },
        mediumCount: { $size: { $ifNull: ["$problemsSolved.medium", []] } },
        hardCount: { $size: { $ifNull: ["$problemsSolved.hard", []] } }
      }
    }
  ]);

  if (!userAggregation || userAggregation.length === 0) {
    res.status(404);
    throw new Error("User not found");
  }

  const user = userAggregation[0];
  const solvedQuestions = user.easyCount + user.mediumCount + user.hardCount;

  let isOnline = false;
  try {
    const onlineStates = await getUsersOnlineState([id]);
    isOnline = Boolean(onlineStates[String(id)]?.isOnline);
  } catch (e) {
    console.error("Error fetching online state:", e);
    isOnline = false;
  }

  res.status(200).json({
    success: true,
    user: {
      ...user,
      isOnline,
      status: user.isDeleted
        ? "Deleted"
        : user.isBlocked
          ? "Blocked"
          : isOnline
            ? "Online"
            : "Active",
      lastLogin: user.lastSeenAt || user.createdAt,
      solvedQuestions,
    },
  });
});


export const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (req.user?._id && String(req.user._id) === String(id)) {
    res.status(400);
    throw new Error("You cannot block your own account");
  }

  const existing = await User.findById(id).select("_id isDeleted");
  if (!existing) {
    res.status(404);
    throw new Error("User not found");
  }
  if (existing.isDeleted) {
    res.status(400);
    throw new Error("Cannot block a deleted user");
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { isBlocked: true, blockedAt: new Date() } },
    { new: true, runValidators: true },
  ).select(
    "_id name email role isBlocked isDeleted blockedAt createdAt updatedAt lastSeenAt avatar",
  );

  if (!updated) {
    res.status(404);
    throw new Error("User not found");
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`user:${String(updated._id)}`).emit("user:blocked", {
      userId: String(updated._id),
    });
    io.in(`user:${String(updated._id)}`).disconnectSockets(true);
  }

  let emailSent = false;
  try {
    emailSent = await sendUserBlockedEmail(updated);
  } catch (e) {
    emailSent = false;
  }

  res.status(200).json({
    success: true,
    message: "User blocked",
    email: { sent: emailSent },
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      isBlocked: updated.isBlocked,
      isDeleted: updated.isDeleted,
      status: "Blocked",
      isOnline: false,
      blockedAt: updated.blockedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastLogin: updated.lastSeenAt || updated.createdAt,
    },
  });
});

// New: PATCH /api/admin/users/:id/unblock
export const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const existing = await User.findById(id).select("_id isDeleted");
  if (!existing) {
    res.status(404);
    throw new Error("User not found");
  }
  if (existing.isDeleted) {
    res.status(400);
    throw new Error("Cannot unblock a deleted user");
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { isBlocked: false, blockedAt: null } },
    { new: true, runValidators: true },
  ).select(
    "_id name email role isBlocked isDeleted blockedAt createdAt updatedAt lastSeenAt avatar",
  );

  if (!updated) {
    res.status(404);
    throw new Error("User not found");
  }

  let emailSent = false;
  try {
    emailSent = await sendUserUnblockedEmail(updated);
  } catch (e) {
    emailSent = false;
  }

  res.status(200).json({
    success: true,
    message: "User unblocked",
    email: { sent: emailSent },
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      isBlocked: updated.isBlocked,
      isDeleted: updated.isDeleted,
      status: "Active",
      blockedAt: updated.blockedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastLogin: updated.lastSeenAt || updated.createdAt,
    },
  });
});

// New: PATCH /api/admin/users/:id/soft-delete
export const softDeleteUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  if (req.user?._id && String(req.user._id) === String(id)) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true, runValidators: true },
  ).select(
    "_id name email role avatar isDeleted deletedAt isBlocked blockedAt createdAt updatedAt lastSeenAt",
  );

  if (!updated) {
    res.status(404);
    throw new Error("User not found");
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`user:${String(updated._id)}`).emit("user:deleted", {
      userId: String(updated._id),
    });
    io.in(`user:${String(updated._id)}`).disconnectSockets(true);
  }

  res.status(200).json({
    success: true,
    message: "User soft deleted",
    user: {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      avatar: updated.avatar,
      role: updated.role,
      isDeleted: updated.isDeleted,
      deletedAt: updated.deletedAt,
      isBlocked: updated.isBlocked,
      blockedAt: updated.blockedAt,
      status: "Deleted",
      isOnline: false,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastLogin: updated.lastSeenAt || updated.createdAt,
      lastSeenAt: updated.lastSeenAt || null,
    },
  });
});

// Optional: PATCH /api/admin/users/:id/role  { role: "admin" | "user" }
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid user id");
  }

  const nextRole = String(role || "").toLowerCase();
  if (!["admin", "user"].includes(nextRole)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  if (req.user?._id && String(req.user._id) === String(id)) {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  const current = await User.findById(id).select("_id role isDeleted");
  if (!current) {
    res.status(404);
    throw new Error("User not found");
  }
  if (current.isDeleted) {
    res.status(400);
    throw new Error("Cannot change role for a deleted user");
  }

  if (current.role === "admin" && nextRole === "user") {
    const adminsCount = await User.countDocuments({ role: "admin" });
    if (adminsCount <= 1) {
      res.status(400);
      throw new Error("Cannot demote the last admin");
    }
  }

  current.role = nextRole;
  await current.save();

  res.status(200).json({
    success: true,
    message: "Role updated",
    user: { _id: current._id, role: current.role },
  });
});


export const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "_id name email role isBlocked createdAt lastSeenAt avatar",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (req.user?._id && String(req.user._id) === String(user._id)) {
    res.status(400);
    throw new Error("You cannot change your own status");
  }

  user.isBlocked = !user.isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User status changed to ${user.isBlocked ? "Blocked" : "Active"}`,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isBlocked: user.isBlocked,
      status: user.isBlocked ? "Blocked" : "Active",
      createdAt: user.createdAt,
      lastLogin: user.lastSeenAt || user.createdAt,
    },
  });
});

// Kept for compatibility but explicitly not implemented (no schema field / business rules defined).
export const softDeleteUser = asyncHandler(async (req, res) => {
  res.status(501);
  throw new Error("Soft delete is not implemented");
});
