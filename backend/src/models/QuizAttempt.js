import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    quizId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Quiz", 
      required: true,
      index: true 
    },
    
    score: { 
      type: Number, 
      default: 0 
    },
    correctAnswers: { 
      type: Number, 
      default: 0 
    },
    
    wrongAnswers: { 
      type: Number, 
      default: 0 
    },
  
    xpGained: { 
      type: Number, 
      default: 0 
    },

    rank: { 
      type: String, 
      enum: ["LEGEND", "ACE", "PRO", "NOVICE", "FAILED"],
      default: "FAILED"
    },
    status: { 
      type: String, 
      enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"], 
      default: "IN_PROGRESS" 
    },
  
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedOption: { type: Number }, // 0, 1, 2, 3
        selectedOptionText: { type: String },
        isCorrect: { type: Boolean },
      },
    ],
   
    timeTaken: { type: Number }, 
    completedAt: { type: Date },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ userId: 1, createdAt: -1 });


quizAttemptSchema.index({ quizId: 1, score: -1, timeTaken: 1 });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
