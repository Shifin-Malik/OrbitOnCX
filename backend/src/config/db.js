import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const DB_URI = process.env.MONGODB_URI;
    if (!DB_URI) {
      throw new Error("Mongodb uri not defined in .env");
    }
    await mongoose.connect(DB_URI);
    console.log("Mongodb connected successfully");
  } catch (error) {
    console.error("Mongodb connection failed", error.message);
    process.exit(1);
  }
};
