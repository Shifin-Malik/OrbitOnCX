import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import { connectDB } from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import { connectRedis } from "./config/redis.js";
import userRoutes from "./routes/userRoutes/userRoute.js";
import adminRoutes from "./routes/adminRoutes/adminRoute.js";
import problemRoutes from "./routes/problemRoutes/problemRoutes.js";
import discussionRoutes from "./routes/discussionRoutes/discussionRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import { initSocket } from "./socket/index.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api", discussionRoutes);

app.get("/", (req, res) => {
  res.status(200).send("API Working Perfectly");
});

app.use(errorHandler);

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log("✅ Mongodb connected successfully");

    await connectRedis();
    console.log("✅ Redis connected successfully");

    // 3. Cloudinary
    await connectCloudinary();
    console.log("✅ Cloudinary configured");

    const httpServer = http.createServer(app);

    const corsOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
    const io = initSocket(httpServer, { corsOrigin });
    app.set("io", io);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
