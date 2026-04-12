import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import axios from "axios";

import User from "../../models/UserModel.js";
import redisClient from "../../config/redis.js";
import { redisKeys } from "../../utlis/redisKeys.js";
import { sendEmail } from "../../utlis/sendEmail.js";
import {
  generateTokens,
  getCookieOptions,
  generateAccessToken,
} from "../../utlis/generateTokens.js";

const OTP_EXPIRY_SECONDS = 15 * 60;
const RESET_OTP_EXPIRY_SECONDS = 10 * 60;
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60;
const LOGIN_ATTEMPT_EXPIRY_SECONDS = 15 * 60;
const LOGIN_BLOCK_EXPIRY_SECONDS = 15 * 60;
const MAX_LOGIN_ATTEMPTS = 5;

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
};

const validatePassword = (password) => {
  return typeof password === "string" && password.trim().length >= 6;
};

const validateName = (name) => {
  return (
    typeof name === "string" &&
    name.trim().length >= 3 &&
    name.trim().length <= 30
  );
};

const generateOtp = () => {
  return otpGenerator.generate(6, {
    digits: true,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

const setRefreshTokenInRedis = async (
  userId,
  refreshToken,
  deviceId = "default",
) => {
  await redisClient.set(
    redisKeys.refreshToken(userId, deviceId),
    refreshToken,
    {
      EX: REFRESH_TOKEN_EXPIRY_SECONDS,
    },
  );
};

const removeRefreshTokenFromRedis = async (userId, deviceId = "default") => {
  await redisClient.del(redisKeys.refreshToken(userId, deviceId));
};

const blacklistRefreshToken = async (refreshToken) => {
  if (!refreshToken) return;

  await redisClient.set(redisKeys.blacklistedRefresh(refreshToken), "1", {
    EX: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
};

const clearAuthCookies = (res) => {
  const options = getCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
};

const getDeviceId = (req) => {
  return req.headers["x-device-id"] || "default";
};

const getGoogleUserInfo = async (accessToken) => {
  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return data;
};

const checkBlockedUser = (user, res) => {
  if (user?.isBlocked) {
    res.status(403);
    throw new Error("Your account has been blocked");
  }
};

const checkDeletedUser = (user, res) => {
  if (user?.isDeleted) {
    res.status(403);
    throw new Error("Your account has been deleted");
  }
};

const incrementLoginAttempts = async (email) => {
  const attemptsKey = redisKeys.loginAttempts(email);
  const blockKey = redisKeys.loginBlock(email);

  const attempts = await redisClient.incr(attemptsKey);

  if (attempts === 1) {
    await redisClient.expire(attemptsKey, LOGIN_ATTEMPT_EXPIRY_SECONDS);
  }

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await redisClient.set(blockKey, "1", {
      EX: LOGIN_BLOCK_EXPIRY_SECONDS,
    });
  }

  return attempts;
};

const clearLoginAttempts = async (email) => {
  await redisClient.del(redisKeys.loginAttempts(email));
  await redisClient.del(redisKeys.loginBlock(email));
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const trimmedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = normalizeEmail(email);

  if (!validateName(trimmedName)) {
    res.status(400);
    throw new Error("Name must be between 3 and 30 characters");
  }

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!validatePassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser && existingUser.isVerified) {
    res.status(400);
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    `${trimmedName}-${Date.now()}`,
  )}`;

  if (existingUser && !existingUser.isVerified) {
    existingUser.name = trimmedName;
    existingUser.password = hashedPassword;
    existingUser.avatar = existingUser.avatar || avatar;
    await existingUser.save();
  } else {
    await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      avatar,
      isVerified: false,
      authProvider: "local",
    });
  }

  await redisClient.set(redisKeys.verifyOtp(normalizedEmail), otp, {
    EX: OTP_EXPIRY_SECONDS,
  });

  await sendEmail(
    normalizedEmail,
    "🔐 Verify Your Email - OrbitonX",
    `
  <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #ecfdf5; padding: 40px;">
    
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
      
      <h2 style="color: #065f46; margin-bottom: 10px;">
        Welcome to OrbitonX 🚀
      </h2>

      <p style="color: #374151; font-size: 14px;">
        Please use the OTP below to verify your email address.
      </p>

      <div style="margin: 25px 0;">
        <span style="
          display: inline-block;
          background: #059669;
          color: white;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
          padding: 12px 24px;
          border-radius: 8px;
        ">
          ${otp}
        </span>
      </div>

      <p style="color: #6b7280; font-size: 13px;">
        ⏳ This OTP will expire in <b>15 minutes</b>
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="color: #9ca3af; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>

      <p style="color: #065f46; font-weight: 600; margin-top: 15px;">
        — OrbitonX Team 
      </p>

    </div>
  </div>
  `,
  );

  res.status(201).json({
    success: true,
    message: "OTP sent to your email",
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const deviceId = getDeviceId(req);

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
    res.status(400);
    throw new Error("Please provide a valid OTP");
  }

  const savedOtp = await redisClient.get(redisKeys.verifyOtp(normalizedEmail));

  if (!savedOtp || savedOtp !== otp.trim()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  checkDeletedUser(user, res);
  checkBlockedUser(user, res);

  user.isVerified = true;
  await user.save();

  await redisClient.del(redisKeys.verifyOtp(normalizedEmail));

  const { refreshToken } = generateTokens(res, user._id, user.role);

  await setRefreshTokenInRedis(user._id.toString(), refreshToken, deviceId);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const deviceId = getDeviceId(req);

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!validatePassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  
  const isBlockedByAttempts = await redisClient.get(
    redisKeys.loginBlock(normalizedEmail),
  );
  if (isBlockedByAttempts) {
    res.status(429);
    throw new Error("Too many failed attempts. Please try again later");
  }

 
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    await incrementLoginAttempts(normalizedEmail);
    res.status(401);
    throw new Error("Invalid credentials");
  }

  
  checkDeletedUser(user, res);
  checkBlockedUser(user, res);

 
  if (user.authProvider === "google") {
    res.status(400);
    throw new Error("This account uses Google sign-in");
  }

  
  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    await incrementLoginAttempts(normalizedEmail);
    res.status(401);
    throw new Error("Invalid credentials");
  }

 
  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email first");
  }

 
  await clearLoginAttempts(normalizedEmail);

 
  const { refreshToken } = generateTokens(res, user._id, user.role);


  await setRefreshTokenInRedis(user._id.toString(), refreshToken, deviceId);
  await User.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } });

 
  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  checkDeletedUser(user, res);
  checkBlockedUser(user, res);

  const otp = generateOtp();

  await redisClient.set(redisKeys.resetOtp(normalizedEmail), otp, {
    EX: RESET_OTP_EXPIRY_SECONDS,
  });

  await sendEmail(
    normalizedEmail,
    "🔑 Reset Your Password - OrbitonX",
    `
  <div style="font-family: 'Poppins', Arial, sans-serif; background-color: #ecfdf5; padding: 40px;">
    
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 5px 20px rgba(0,0,0,0.05);">
      
      <h2 style="color: #065f46; margin-bottom: 10px;">
        Reset Your Password 🔑
      </h2>

      <p style="color: #374151; font-size: 14px;">
        Use the OTP below to reset your password.
      </p>

      <div style="margin: 25px 0;">
        <span style="
          display: inline-block;
          background: #059669;
          color: white;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
          padding: 12px 24px;
          border-radius: 8px;
        ">
          ${otp}
        </span>
      </div>

      <p style="color: #6b7280; font-size: 13px;">
        ⏳ This OTP will expire in <b>10 minutes</b>
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;" />

      <p style="color: #9ca3af; font-size: 12px;">
        If you did not request a password reset, please ignore this email.
      </p>

      <p style="color: #065f46; font-weight: 600; margin-top: 15px;">
        — OrbitonX Team 
      </p>

    </div>
  </div>
  `,
  );

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email",
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
    res.status(400);
    throw new Error("Please provide a valid OTP");
  }

  if (!validatePassword(newPassword)) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const savedOtp = await redisClient.get(redisKeys.resetOtp(normalizedEmail));

  if (!savedOtp || savedOtp !== otp.trim()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  checkDeletedUser(user, res);
  checkBlockedUser(user, res);

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    res.status(400);
    throw new Error("New password cannot be the same as the old password");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  await redisClient.del(redisKeys.resetOtp(normalizedEmail));
  await removeRefreshTokenFromRedis(user._id.toString());
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Password reset successful. Please login again",
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const deviceId = getDeviceId(req);

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      await removeRefreshTokenFromRedis(decoded.id, deviceId);
      await blacklistRefreshToken(refreshToken);
    } catch (error) {
      console.warn("Logout token verification failed:", error.message);
    }
  }

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const deviceId = getDeviceId(req);

  if (!refreshToken) {
    res.status(401);
    throw new Error("No refresh token found");
  }

  const isBlacklisted = await redisClient.get(
    redisKeys.blacklistedRefresh(refreshToken),
  );

  if (isBlacklisted) {
    res.status(401);
    throw new Error("Refresh token is blacklisted");
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  const storedToken = await redisClient.get(
    redisKeys.refreshToken(decoded.id, deviceId),
  );

  if (!storedToken || storedToken !== refreshToken) {
    res.status(401);
    throw new Error("Session expired. Please login again");
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  checkDeletedUser(user, res);
  checkBlockedUser(user, res);

  const newAccessToken = generateAccessToken(user._id, user.role);

  res.cookie("accessToken", newAccessToken, {
    ...getCookieOptions(),
    maxAge: 15 * 60 * 1000,
  });

  await User.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } });

  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { access_token } = req.body;
  console.log(access_token)
  const deviceId = getDeviceId(req);

  if (!access_token || typeof access_token !== "string") {
    res.status(400);
    throw new Error("Google access token is required");
  }

  let googleData;
  try {
    googleData = await getGoogleUserInfo(access_token);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid Google access token");
  }

  const { email, name, picture, sub: googleId } = googleData;
  const normalizedEmail = normalizeEmail(email);

  if (!validateEmail(normalizedEmail)) {
    res.status(400);
    throw new Error("Unable to fetch valid Google account email");
  }

  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    checkDeletedUser(user, res);
    checkBlockedUser(user, res);

    if (user.authProvider === "local" && !user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      user.isVerified = true;
      if (picture) user.avatar = picture;
      await user.save({ validateBeforeSave: false });
    }
  } else {
    user = await User.create({
      name: name?.trim() || "Google User",
      email: normalizedEmail,
      avatar: picture || "",
      googleId,
      authProvider: "google",
      isVerified: true,
    });
  }

  const { refreshToken } = generateTokens(res, user._id, user.role);

  await setRefreshTokenInRedis(user._id.toString(), refreshToken, deviceId);
  await User.updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } });

  res.status(200).json({
    success: true,
    message: "Google login successful",
  });
});
