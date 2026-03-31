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
  const userId = req.user._id;

  const updateData = { ...req.body };

  delete updateData.oldPassword;
  delete updateData.newPassword;

  for (let key in updateData) {
    if (typeof updateData[key] === "string") {
      updateData[key] = updateData[key].trim();
    }
  }

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
    { new: true, runValidators: true },
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

  if (isAlreadyFollowing) {
    await Promise.all([
      User.findByIdAndUpdate(targetId, { $pull: { followers: currentUserId } }),
      User.findByIdAndUpdate(currentUserId, { $pull: { following: targetId } }),
    ]);
  } else {
    await Promise.all([
      User.findByIdAndUpdate(targetId, {
        $addToSet: { followers: currentUserId },
      }),
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetId },
      }),
    ]);
  }

  res.status(200).json({
    success: true,
    isFollowing: !isAlreadyFollowing,
    message: !isAlreadyFollowing
      ? "Followed successfully"
      : "Unfollowed successfully",
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select(EXCLUDE_FIELDS)
    .populate("followers", "name profilePic avatar bio") 
    .populate("following", "name profilePic avatar bio");

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
    user: { ...userObj, stats },
  });
});
