import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    q: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Advanced"],
      default: "Easy",
    },

    explanation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

questionSchema.index({ quizId: 1, difficulty: 1 });

questionSchema.index({ quizId: 1, createdAt: -1 });

const Question =
  mongoose.models.Question || mongoose.model("Question", questionSchema);

export default Question;
