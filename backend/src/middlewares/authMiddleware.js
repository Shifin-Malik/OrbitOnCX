import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token found",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Access denied. Admins only.",
    });
  }
};
