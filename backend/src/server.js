import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import { connectRedis } from "./config/redis.js";
import userRoutes from "./routes/userRoutes/userRoute.js";
import errorHandler from "./middlewares/errorMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.status(200).send("API Working");
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await connectCloudinary();

    console.log("PORT:", process.env.PORT);
    console.log("MONGO:", process.env.MONGODB_URI);
    console.log("CLOUDINARY:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("FRONTEND_URL:", process.env.FRONTEND_URL);

    app.listen(PORT, () => {
      console.log(`Server running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();