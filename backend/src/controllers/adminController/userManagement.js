import User from "../../models/UserModel.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
      _id: { $ne: req.user._id },
    }).select(
      "-password -otp -otpExpire -resetPasswordToken -resetPasswordExpire",
    );

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};
