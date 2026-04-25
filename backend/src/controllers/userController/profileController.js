import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../../models/userModel.js";


const EXCLUDE_FIELDS =
  "-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire -__v";

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select(EXCLUDE_FIELDS)
    .populate("followers", "name profilePic avatar")
    .populate("following", "name profilePic avatar");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const userObj = user.toObject();
  const stats = {
    totalSolved:
      (user.problemsSolved?.easy?.length || 0) +
      (user.problemsSolved?.medium?.length || 0) +
      (user.problemsSolved?.hard?.length || 0),
    easySolved: user.problemsSolved?.easy?.length || 0,
    mediumSolved: user.problemsSolved?.medium?.length || 0,
    hardSolved: user.problemsSolved?.hard?.length || 0,
    followerCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
  };

  res.status(200).json({
    success: true,
    user: { ...userObj, stats },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  console.log("--- DEBUG START ---");
  console.log("Req Body:", req.body);
  console.log("Req File:", req.file);
  console.log("--- DEBUG END ---");
  const userId = req.user._id;
  const updateData = { ...req.body };

  delete updateData.oldPassword;
  delete updateData.newPassword;

  if (req.file) {
    updateData.avatar = req.file.path;
  }

  if (req.body.newPassword) {
    const user = await User.findById(userId).select("+password");
    if (!req.body.oldPassword) {
      res.status(400);
      throw new Error("Current password is required");
    }
    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Current password incorrect");
    }
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(req.body.newPassword, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      returnDocument: "after",
      runValidators: true,
    },
  ).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const search = req.query.search ? req.query.search.trim() : "";
  const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyword = search ? { name: { $regex: safeSearch, $options: "i" } } : {};

  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .select("name avatar bio followers")
    .limit(10);

  res.status(200).json({
    success: true,
    users,
  });
});

export const toggleFollow = asyncHandler(async (req, res) => {
  const { id: targetId } = req.params;
  const currentUserId = req.user._id;

  if (targetId === currentUserId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const isAlreadyFollowing = targetUser.followers.some(
    (id) => id.toString() === currentUserId.toString(),
  );

  const [updatedTargetUser, updatedCurrentUser] = await Promise.all(
    isAlreadyFollowing
      ? [
          User.findByIdAndUpdate(
            targetId,
            { $pull: { followers: currentUserId } },
            { returnDocument: "after" },
          ).select("followers"),
          User.findByIdAndUpdate(
            currentUserId,
            { $pull: { following: targetId } },
            { returnDocument: "after" },
          ).select("following"),
        ]
      : [
          User.findByIdAndUpdate(
            targetId,
            { $addToSet: { followers: currentUserId } },
            { returnDocument: "after" },
          ).select("followers"),
          User.findByIdAndUpdate(
            currentUserId,
            { $addToSet: { following: targetId } },
            { returnDocument: "after" },
          ).select("following"),
        ],
  );

  res.status(200).json({
    success: true,
    targetUserId: targetId,
    isFollowing: !isAlreadyFollowing,
    targetFollowerCount: updatedTargetUser?.followers?.length || 0,
    currentFollowingCount: updatedCurrentUser?.following?.length || 0,
    currentUserFollowingIds: updatedCurrentUser?.following || [],
    message: !isAlreadyFollowing
      ? "Followed successfully"
      : "Unfollowed successfully",
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select(EXCLUDE_FIELDS)
    .populate("followers", "name avatar bio")
    .populate("following", "name avatar bio");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const userObj = user.toObject();

  const stats = {
    totalSolved:
      (user.problemsSolved?.easy?.length || 0) +
      (user.problemsSolved?.medium?.length || 0) +
      (user.problemsSolved?.hard?.length || 0),
    followerCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
  };

  res.status(200).json({
    success: true,
    user: {
      ...userObj,
      stats,
      isFollowing: (req.user?.following || []).some(
        (id) => id.toString() === user._id.toString(),
      ),
    },
  });
});

const SEARCH_HISTORY_USER_FIELDS = "_id name avatar bio";
const MAX_RECENT_SEARCHES = 10;

export const getSearchHistory = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id)
    .select("recentSearches")
    .populate("recentSearches", SEARCH_HISTORY_USER_FIELDS);

  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const populated = (currentUser.recentSearches || []).filter(Boolean);
  const users = populated.slice(0, MAX_RECENT_SEARCHES);

  if ((currentUser.recentSearches || []).length > MAX_RECENT_SEARCHES) {
    currentUser.recentSearches = currentUser.recentSearches.slice(
      0,
      MAX_RECENT_SEARCHES,
    );
    await currentUser.save();
  }

  res.status(200).json({
    success: true,
    users,
  });
});

export const addToSearchHistory = asyncHandler(async (req, res) => {
  const { searchedUserId } = req.body || {};

  if (!searchedUserId) {
    res.status(400);
    throw new Error("searchedUserId is required");
  }

  if (searchedUserId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot add yourself to search history");
  }

  const searchedUser = await User.findById(searchedUserId).select(
    SEARCH_HISTORY_USER_FIELDS,
  );

  if (!searchedUser) {
    res.status(404);
    throw new Error("Searched user not found");
  }

  const currentUser = await User.findById(req.user._id).select("recentSearches");
  if (!currentUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const normalizedId = searchedUserId.toString();
  currentUser.recentSearches = (currentUser.recentSearches || []).filter(
    (id) => id.toString() !== normalizedId,
  );
  currentUser.recentSearches.unshift(searchedUserId);
  currentUser.recentSearches = currentUser.recentSearches.slice(
    0,
    MAX_RECENT_SEARCHES,
  );

  await currentUser.save();

  const updated = await User.findById(req.user._id)
    .select("recentSearches")
    .populate("recentSearches", SEARCH_HISTORY_USER_FIELDS);

  res.status(200).json({
    success: true,
    users: (updated?.recentSearches || []).filter(Boolean),
  });
});

export const removeFromSearchHistory = asyncHandler(async (req, res) => {
  const { searchedUserId } = req.params;

  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { recentSearches: searchedUserId } },
    { new: true },
  );

  const updated = await User.findById(req.user._id)
    .select("recentSearches")
    .populate("recentSearches", SEARCH_HISTORY_USER_FIELDS);

  res.status(200).json({
    success: true,
    users: (updated?.recentSearches || []).filter(Boolean),
  });
});

export const clearSearchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { recentSearches: [] } });

  res.status(200).json({
    success: true,
    users: [],
  });
});
