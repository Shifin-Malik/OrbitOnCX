import mongoose from "mongoose";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DEFAULT_LANGUAGES = ["javascript", "python", "java", "cpp"];

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const normalizeStringArray = (value) => {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(value)) return [];

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const toLanguageCodeObject = (value) => {
  const source =
    value && typeof value.toObject === "function"
      ? value.toObject()
      : value || {};

  return {
    javascript: String(source.javascript || ""),
    python: String(source.python || ""),
    java: String(source.java || ""),
    cpp: String(source.cpp || ""),
  };
};

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, default: "" },
    output: { type: String, required: true, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const visibleTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, default: "" },
    output: { type: String, required: true, default: "" },
    explanation: { type: String, default: "" },
    // legacy field kept for backward compatibility with old documents
    expectedOutput: { type: String, default: "" },
  },
  { _id: false },
);

const hiddenTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, default: "" },
    output: { type: String, required: true, default: "" },
    // legacy field kept for backward compatibility with old documents
    expectedOutput: { type: String, default: "" },
  },
  { _id: false },
);

const starterCodeSchema = new mongoose.Schema(
  {
    javascript: { type: String, default: "" },
    python: { type: String, default: "" },
    java: { type: String, default: "" },
    cpp: { type: String, default: "" },
  },
  { _id: false },
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      unique: true,
      index: true,
    },
    titleLower: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: { type: String, required: true, default: "" },
    difficulty: {
      type: String,
      required: true,
      enum: DIFFICULTIES,
      index: true,
    },

    tags: {
      type: [String],
      default: [],
      set: normalizeStringArray,
      index: true,
    },
    constraints: {
      type: [String],
      default: [],
      set: normalizeStringArray,
    },
    hints: {
      type: [String],
      default: [],
      set: normalizeStringArray,
    },

    examples: { type: [exampleSchema], default: [] },
    visibleTestCases: { type: [visibleTestCaseSchema], default: [] },
    hiddenTestCases: { type: [hiddenTestCaseSchema], default: [], select: false },

    supportedLanguages: {
      type: [String],
      default: DEFAULT_LANGUAGES,
      set: normalizeStringArray,
    },

    starterCode: { type: starterCodeSchema, default: () => ({}) },
    referenceSolution: { type: starterCodeSchema, default: () => ({}) },
    problemCode: { type: starterCodeSchema, default: () => ({}) },

    submissionsCount: { type: Number, default: 0, min: 0 },
    solvedCount: { type: Number, default: 0, min: 0 },
    acceptanceRate: { type: Number, default: 0, min: 0 },

    // legacy counters retained for compatibility with existing user-side APIs
    submissionCount: { type: Number, default: 0, min: 0 },
    acceptanceCount: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

problemSchema.pre("validate", function normalizeProblem() {
  this.title = String(this.title || "").trim();
  if (this.title) {
    this.titleLower = this.title.toLowerCase();
  }

  const nextSlug = slugify(this.slug || this.title);
  this.slug = nextSlug;

  if (Array.isArray(this.visibleTestCases)) {
    this.visibleTestCases = this.visibleTestCases.map((testCase) => {
      const source = testCase?.toObject ? testCase.toObject() : testCase || {};
      const output = String(source.output || source.expectedOutput || "");
      return {
        input: String(source.input || ""),
        output,
        explanation: String(source.explanation || ""),
        expectedOutput: output,
      };
    });
  }

  if (Array.isArray(this.hiddenTestCases)) {
    this.hiddenTestCases = this.hiddenTestCases.map((testCase) => {
      const source = testCase?.toObject ? testCase.toObject() : testCase || {};
      const output = String(source.output || source.expectedOutput || "");
      return {
        input: String(source.input || ""),
        output,
        expectedOutput: output,
      };
    });
  }

  this.starterCode = toLanguageCodeObject(this.starterCode);
  this.referenceSolution = toLanguageCodeObject(this.referenceSolution);
  this.problemCode = toLanguageCodeObject(this.problemCode);

  const normalizedSubmissions = Math.max(
    0,
    Number(this.submissionsCount ?? this.submissionCount ?? 0) || 0,
  );
  const normalizedSolved = Math.max(
    0,
    Number(this.solvedCount ?? this.acceptanceCount ?? 0) || 0,
  );

  this.submissionsCount = normalizedSubmissions;
  this.submissionCount = normalizedSubmissions;
  this.solvedCount = normalizedSolved;
  this.acceptanceCount = normalizedSolved;
  this.acceptanceRate =
    normalizedSubmissions > 0
      ? Number(((normalizedSolved / normalizedSubmissions) * 100).toFixed(2))
      : 0;

});

problemSchema.index({ createdAt: -1 });
problemSchema.index({ difficulty: 1, isActive: 1 });
problemSchema.index({ title: "text" });

const Problem =
  mongoose.models.Problem || mongoose.model("Problem", problemSchema);

export { DIFFICULTIES, DEFAULT_LANGUAGES, slugify };
export default Problem;

