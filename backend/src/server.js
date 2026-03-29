import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";

import userRoutes from "./routes/userRoutes/userRoute.js";

import errorHandler from "./middlewares/errorMiddleware.js";

// import redisClient from './config/redis.js';
const app = express();
const PORT = process.env.PORT || 5001;

connectDB();

connectCloudinary();

// redisClient()

console.log("PORT:", process.env.PORT);
console.log("MONGO:", process.env.MONGODB_URI);
console.log("CLOUDINARY:", process.env.CLOUDINARY_CLOUD_NAME);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

console.log(process.env.FRONTEND_URL);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use("/api/users", userRoutes);


app.get("/", (req, res) => {
  res.send("API Working");
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
