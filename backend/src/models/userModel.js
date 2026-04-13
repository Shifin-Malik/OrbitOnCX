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

    totalXp: {
      type: Number,
      default: 0,
    },

    socialLinks: {
      github: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSolvedDayKey: { type: String, default: null }, // YYYY-MM-DD (UTC)
    lastActivity: { type: Date },
    lastSeenAt: { type: Date, default: null, index: true },
    isOnline: {
      type: Boolean,
      default: false,
      index: true, 
    },
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

    blockedAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    recentSearches: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
