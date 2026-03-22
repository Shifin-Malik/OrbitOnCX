import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../../models/userModel.js"; 

const EXCLUDE_FIELDS =
  "-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire -__v";


export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(EXCLUDE_FIELDS);

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
  const {
    name,
    bio,
    github,
    linkedin,
    website,
    oldPassword,
    newPassword,
    avatar, 
  } = req.body;

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  
  if (name !== undefined) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();

  
  if (req.file) {
    
    user.avatar = req.file.path;
  } else if (avatar) {
   
    user.avatar = avatar;
  }

  
  user.socialLinks = {
    github: github !== undefined ? github : user.socialLinks?.github,
    linkedin: linkedin !== undefined ? linkedin : user.socialLinks?.linkedin,
    website: website !== undefined ? website : user.socialLinks?.website,
  };

  
  if (newPassword) {
    if (!oldPassword) {
      res.status(400);
      throw new Error("Current password is required");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Current password incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  user.markModified("socialLinks");
  await user.save();

  const updatedUser = await User.findById(user._id).select("-password");

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});
