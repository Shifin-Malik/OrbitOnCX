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
        // authProvider 'local' ആണെങ്കിൽ മാത്രം പാസ്‌വേഡ് നിർബന്ധമാക്കുന്നു
        return this.authProvider === "local";
      },
      minlength: 6,
      select: false,
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },

    // CHANGE 3: ഗൂഗിൾ ഐഡി സേവ് ചെയ്യാൻ (ഓപ്ഷണൽ - സെക്യൂരിറ്റിക്ക് നല്ലതാണ്)
    googleId: {
      type: String,
      unique: true,
      sparse: true, // ഇമെയിൽ ലോഗിൻ ചെയ്യുന്നവർക്ക് ഇത് ഉണ്ടാവില്ല, അതുകൊണ്ട് sparse നിർബന്ധമാണ്
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: { type: String, default: undefined },
    otpExpire: { type: Date },

    resetPasswordToken: { type: String, default: undefined },
    resetPasswordExpire: { type: Date },

    avatar: {
      type: String,
      default: "",
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
      linkedin: { type: String, default: "" },
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
