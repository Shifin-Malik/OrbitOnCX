import asyncHandler from "express-async-handler";
import User from "../../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateTokens,
  getCookieOptions,
  generateAccessToken,
} from "../../utlis/generateTokens.js";
import otpGenerator from "otp-generator";
import { sendEmail } from "../../utlis/sendEmail.js";
import axios from "axios";


export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await User.findOne({ email: normalizedEmail });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });
  const otpExpire = Date.now() + 15 * 60 * 1000; 

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const seed = `${name.trim()}-${Date.now()}`;
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    avatar,
    otp,
    otpExpire,
  });

  const htmlContent = `
    <div style="font-family: sans-serif; text-align: center;">
      <h2>Welcome to OrbitonCX!</h2>
      <p>Please use the following OTP to verify your account:</p>
      <h1 style="color: #6366f1; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in 15 minutes.</p>
    </div>
  `;

  const emailSent = await sendEmail(
    normalizedEmail,
    "Verify Your Account - OrbitonCX",
    `Your OTP is ${otp}`,
    htmlContent,
  );

  if (!emailSent) {
    await User.findByIdAndDelete(user._id);
    res.status(500);
    throw new Error("Error sending verification email. Please try again.");
  }

  res.status(201).json({
    success: true,
    message: "Registration successful! OTP sent to email.",
    email: user.email,
  });
});


export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
    otp: otp.trim(),
    otpExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  generateTokens(res, user._id, user.role);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});


export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password",
  );

  
  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  ) {
    res.status(401);
    throw new Error("Invalid credentials");
  }


  if (user.otp) {
    res.status(403);
    throw new Error("Please verify your email before logging in.");
  }

 
  generateTokens(res, user._id, user.role);

  res.status(200).json({
    success: true,
    message: "User login successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const formattedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: formattedEmail });

  if (!user) {
    res.status(404);
    throw new Error("No account found with this email");
  }

  
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true,
  });

  
  user.otp = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; 
  await user.save();

  
  const htmlContent = `
    <div style="font-family: sans-serif; text-align: center; border: 1px solid #e2e8f0; padding: 20px; border-radius: 10px;">
      <h2 style="color: #1e293b;">Password Reset Request</h2>
      <p style="color: #475569;">Use the OTP below to reset your password. This code is valid for 10 minutes.</p>
      <div style="background-color: #f1f5f9; padding: 10px; display: inline-block; border-radius: 5px;">
        <h1 style="color: #6366f1; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

 
  try {
    const emailSent = await sendEmail(
      formattedEmail,
      "Password Reset OTP - OrbitonCX",
      `Your password reset OTP is ${otp}`,
      htmlContent, 
    );

    if (!emailSent) {
      throw new Error("Email provider error");
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error("Email could not be sent. Please try again later.");
  }
});


export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error("Please provide email, otp, and new password");
  }

  const formattedEmail = email.toLowerCase().trim();

  
  const user = await User.findOne({
    email: formattedEmail,
    otp: otp.toString().trim(),
    otpExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

 
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  
  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successful. You can now login.",
  });
});


export const logoutUser = asyncHandler(async (req, res) => {
  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    res.status(401);
    throw new Error("No refresh token");
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    res.cookie("accessToken", newAccessToken, {
      ...getCookieOptions(),
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.clearCookie("accessToken", getCookieOptions());
    res.clearCookie("refreshToken", getCookieOptions());
    res.status(401);
    throw new Error("Invalid refresh token");
  }
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    res.status(400);
    throw new Error("Access token is required");
  }

  try {
    const { data } = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
    );

    const { email, name, picture, sub: googleId } = data;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        avatar: picture,
        googleId,
        authProvider: "google",
        isVerified: true,
      });
    } else {
      user.googleId = googleId;
      user.authProvider = "google";
      user.isVerified = true;

      if (!user.avatar) user.avatar = picture;

      
      await user.save({ validateBeforeSave: false });
    }

    generateTokens(res, user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error.response?.data || error.message);
    res.status(401);
    throw new Error("Google authentication failed. Please try again.");
  }
});
