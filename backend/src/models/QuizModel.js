import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      index: true,
      enum: [
        "JavaScript",
        "TypeScript",
        "React",
        "Node.js",
        "MongoDB",
        "CSS",
        "Full-Stack",
        "Python",
        "Go"
      ],
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["Easy", "Medium", "Advanced"],
      default: "Easy",
    },
    xpPotential: {
      type: Number,
      default: 1000,
    },

    timeLimit: {
      type: Number,
      default: 600,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },

    thumbnail: {
      type: String,
      default: "https://via.placeholder.com/150",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

quizSchema.index({ isActive: 1, createdAt: -1 });
quizSchema.index({ category: 1, difficulty: 1, isActive: 1 });

export default mongoose.model("Quiz", quizSchema);
