import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, default: "" },
    expectedOutput: { type: String, required: true, default: "" },
  },
  { _id: false },
);

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    difficulty: {
      type: String,
      required: true,
      enum: DIFFICULTIES,
      index: true,
    },

    description: { type: String, required: true, default: "" },
    constraints: { type: [String], default: [] },
    examples: { type: [exampleSchema], default: [] },
    tags: { type: [String], default: [], index: true },
    hints: { type: [String], default: [] },

    supportedLanguages: {
      type: [String],
      default: ["javascript", "python", "java", "cpp"],
    },
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },

    visibleTestCases: { type: [testCaseSchema], default: [] },
    hiddenTestCases: { type: [testCaseSchema], default: [], select: false },

    submissionCount: { type: Number, default: 0 },
    acceptanceCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

problemSchema.index({ createdAt: -1 });
problemSchema.index({ title: "text" });

const Problem =
  mongoose.models.Problem || mongoose.model("Problem", problemSchema);

export default Problem;

