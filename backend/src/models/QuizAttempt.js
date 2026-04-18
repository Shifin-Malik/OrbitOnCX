import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    xpGained: {
      type: Number,
      default: 0,
    },

    rank: {
      type: String,
      enum: ["LEGEND", "ACE", "PRO", "NOVICE", "FAILED"],
      default: "FAILED",
    },

    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
      default: "IN_PROGRESS",
    },

    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: {
          type: Number,
          min: 0,
          max: 3,
        },
        selectedOptionText: {
          type: String,
          trim: true,
        },
        isCorrect: {
          type: Boolean,
        },
      },
    ],

    timeTaken: {
      type: Number,
      default: 0,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


quizAttemptSchema.index({ userId: 1, quizId: 1, status: 1, createdAt: -1 });
quizAttemptSchema.index({ quizId: 1, status: 1, score: -1, timeTaken: 1, completedAt: -1, createdAt: -1 });
quizAttemptSchema.index({ userId: 1, createdAt: -1, status: 1 });

const QuizAttempt =
  mongoose.models.QuizAttempt ||
  mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;