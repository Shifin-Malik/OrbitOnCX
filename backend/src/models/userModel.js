import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: 6,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    bio: {
      type: String,
      maxlength: 200,
      default: "",
    },

    quizScore: {
      type: Number,
      default: 0,
    },

    socialLinks: {
      github: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    streak: { type: Number, default: 0 },
    lastActivity: { type: Date },

    problemsSolved: {
      easy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
      medium: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
      hard: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
    },

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    bookmarkedProblems: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
    ],

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
