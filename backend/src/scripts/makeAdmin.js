import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import User from "../models/UserModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const makeAdmin = async () => {
  try {
    await connectDB();
    console.log("Database connection established for script...");

    const emailToPromote = process.argv[2];

    if (!emailToPromote) {
      console.log("❌ Please provide an email.");
      console.log("Example: node src/scripts/makeAdmin.js shifinmalik7@gmail.com");
      process.exit(1);
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: emailToPromote.toLowerCase().trim() },
      { role: "admin" },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      console.log("❌ Error: User with that email not found in Database.");
    } else {
      console.log("------------------------------------------");
      console.log(`✅ Success: ${updatedUser.name} is now an ADMIN!`);
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`🛡️ Role: ${updatedUser.role}`);
      console.log("------------------------------------------");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Script Error:", error.message);
    process.exit(1);
  }
};

makeAdmin();