import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    q: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length === 4;
        },
        message: "A professional quiz question must have exactly 4 options.",
      },
      required: true,
    },

    correctAnswer: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return this.options.includes(v);
        },
        message: "The correct answer must be one of the four options provided.",
      },
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Advanced"],
      default: "Easy",
      index: true,
    },

    explanation: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

questionSchema.post("save", async function () {
  await mongoose.model("Quiz").findByIdAndUpdate(this.quizId, {
    $inc: { totalQuestions: 1 },
  });
});

questionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose.model("Quiz").findByIdAndUpdate(doc.quizId, {
      $inc: { totalQuestions: -1 },
    });
  }
});

export default mongoose.model("Question", questionSchema);
