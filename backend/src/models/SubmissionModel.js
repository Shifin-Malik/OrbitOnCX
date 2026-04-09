import mongoose from "mongoose";

const STATUSES = [
  "accepted",
  "wrong_answer",
  "compile_error",
  "runtime_error",
  "time_limit_exceeded",
  "internal_error",
];

const submissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true, index: true },
    language: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, maxlength: 200000 },

    status: { type: String, required: true, enum: STATUSES, index: true },
    isAccepted: { type: Boolean, default: false, index: true },

    runtime: { type: Number, default: null }, // seconds (Judge0 returns string; we normalize)
    memory: { type: Number, default: null }, // KB

    judgeResponse: { type: Object, default: null },
    failedTestCaseSummary: { type: Object, default: null },
  },
  { timestamps: true },
);

submissionSchema.index({ user: 1, createdAt: -1 });
submissionSchema.index({ user: 1, problem: 1, createdAt: -1 });
submissionSchema.index({ problem: 1, createdAt: -1 });

const Submission =
  mongoose.models.Submission || mongoose.model("Submission", submissionSchema);

export default Submission;

