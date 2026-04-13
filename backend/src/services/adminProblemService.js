import mongoose from "mongoose";
import { DEFAULT_LANGUAGES, DIFFICULTIES, slugify } from "../models/ProblemModel.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const parseJsonIfNeeded = (value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;

  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
};

const asPlainObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const toStringSafe = (value) => String(value ?? "");

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "active", "enabled"].includes(normalized)) return true;
    if (["false", "0", "no", "inactive", "disabled"].includes(normalized)) return false;
  }

  return fallback;
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const normalizePagination = (query = {}) => {
  const page = parsePositiveInt(query.page, DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parsePositiveInt(query.limit, DEFAULT_LIMIT)),
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildProblemListMatch = (query = {}) => {
  const match = {};

  const search = String(query.search || query.keyword || "").trim();
  if (search) {
    const safe = escapeRegex(search);
    match.$or = [
      { title: { $regex: safe, $options: "i" } },
      { slug: { $regex: safe, $options: "i" } },
      { tags: { $regex: safe, $options: "i" } },
    ];
  }

  if (DIFFICULTIES.includes(query.difficulty)) {
    match.difficulty = query.difficulty;
  }

  const status = String(query.status || "").toLowerCase();
  if (status === "active") match.isActive = true;
  if (status === "inactive") match.isActive = false;

  return match;
};

export const resolveProblemSort = (sortBy = "") => {
  const normalized = String(sortBy || "newest").toLowerCase();

  if (normalized === "oldest") return { createdAt: 1, _id: 1 };
  if (normalized === "title") return { title: 1, _id: 1 };
  if (normalized === "updated") return { updatedAt: -1, _id: -1 };
  return { createdAt: -1, _id: -1 };
};

const normalizeStringArrayInput = (value) => {
  const parsed = parseJsonIfNeeded(value);

  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
};

const normalizeCodeBundle = (value) => {
  const parsed = parseJsonIfNeeded(value);
  const source = asPlainObject(parsed);

  return {
    javascript: toStringSafe(source.javascript).trim(),
    python: toStringSafe(source.python).trim(),
    java: toStringSafe(source.java).trim(),
    cpp: toStringSafe(source.cpp).trim(),
  };
};

const normalizeExamplesInput = (value) => {
  const parsed = parseJsonIfNeeded(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => asPlainObject(item))
    .map((item) => ({
      input: toStringSafe(item.input),
      output: toStringSafe(item.output ?? item.expectedOutput),
      explanation: toStringSafe(item.explanation),
    }))
    .filter((item) => item.input || item.output || item.explanation);
};

const normalizeVisibleTestCasesInput = (value) => {
  const parsed = parseJsonIfNeeded(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => asPlainObject(item))
    .map((item) => ({
      input: toStringSafe(item.input),
      output: toStringSafe(item.output ?? item.expectedOutput),
      explanation: toStringSafe(item.explanation),
    }))
    .filter((item) => item.input || item.output || item.explanation);
};

const normalizeHiddenTestCasesInput = (value) => {
  const parsed = parseJsonIfNeeded(value);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => asPlainObject(item))
    .map((item) => ({
      input: toStringSafe(item.input),
      output: toStringSafe(item.output ?? item.expectedOutput),
    }))
    .filter((item) => item.input || item.output);
};

const parseNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
};

const validateExamples = (examples, errors) => {
  examples.forEach((example, index) => {
    if (!String(example.input || "").trim()) {
      errors.push(`examples[${index}].input is required`);
    }
    if (!String(example.output || "").trim()) {
      errors.push(`examples[${index}].output is required`);
    }
  });
};

const validateVisibleTestCases = (cases, errors) => {
  cases.forEach((testCase, index) => {
    if (!String(testCase.input || "").trim()) {
      errors.push(`visibleTestCases[${index}].input is required`);
    }
    if (!String(testCase.output || "").trim()) {
      errors.push(`visibleTestCases[${index}].output is required`);
    }
  });
};

const validateHiddenTestCases = (cases, errors) => {
  cases.forEach((testCase, index) => {
    if (!String(testCase.input || "").trim()) {
      errors.push(`hiddenTestCases[${index}].input is required`);
    }
    if (!String(testCase.output || "").trim()) {
      errors.push(`hiddenTestCases[${index}].output is required`);
    }
  });
};

export const normalizeProblemPayload = (payload = {}, { isUpdate = false } = {}) => {
  const sourceRaw = parseJsonIfNeeded(payload);
  const source =
    sourceRaw?.problem && typeof sourceRaw.problem === "object"
      ? sourceRaw.problem
      : sourceRaw;

  const input = asPlainObject(source);
  const value = {};
  const errors = [];

  if (!isUpdate || input.title !== undefined) {
    const title = String(input.title || "").trim();
    if (!title) errors.push("title is required");
    else if (title.length > 120) errors.push("title must be at most 120 characters");
    else value.title = title;
  }

  if (!isUpdate || input.description !== undefined) {
    const description = String(input.description || "").trim();
    if (!description) errors.push("description is required");
    else value.description = description;
  }

  if (!isUpdate || input.slug !== undefined) {
    const slug = slugify(input.slug || input.title || "");
    if (!slug) errors.push("slug is required");
    else value.slug = slug;
  }

  if (!isUpdate || input.difficulty !== undefined) {
    if (!DIFFICULTIES.includes(input.difficulty)) {
      errors.push(`difficulty must be one of: ${DIFFICULTIES.join(", ")}`);
    } else {
      value.difficulty = input.difficulty;
    }
  }

  if (!isUpdate || input.tags !== undefined) {
    value.tags = normalizeStringArrayInput(input.tags);
  }

  if (!isUpdate || input.constraints !== undefined) {
    value.constraints = normalizeStringArrayInput(input.constraints);
  }

  if (!isUpdate || input.hints !== undefined) {
    value.hints = normalizeStringArrayInput(input.hints);
  }

  if (!isUpdate || input.examples !== undefined) {
    value.examples = normalizeExamplesInput(input.examples);
    validateExamples(value.examples, errors);
  }

  if (!isUpdate || input.visibleTestCases !== undefined) {
    value.visibleTestCases = normalizeVisibleTestCasesInput(input.visibleTestCases);
    validateVisibleTestCases(value.visibleTestCases, errors);
  }

  if (!isUpdate || input.hiddenTestCases !== undefined) {
    value.hiddenTestCases = normalizeHiddenTestCasesInput(input.hiddenTestCases);
    validateHiddenTestCases(value.hiddenTestCases, errors);
  }

  if (!isUpdate || input.supportedLanguages !== undefined) {
    const normalizedLanguages = normalizeStringArrayInput(input.supportedLanguages);
    value.supportedLanguages =
      normalizedLanguages.length > 0 ? normalizedLanguages : DEFAULT_LANGUAGES;
  }

  if (!isUpdate || input.starterCode !== undefined) {
    value.starterCode = normalizeCodeBundle(input.starterCode);
  }

  if (!isUpdate || input.referenceSolution !== undefined) {
    value.referenceSolution = normalizeCodeBundle(input.referenceSolution);
  }

  if (!isUpdate || input.problemCode !== undefined) {
    value.problemCode = normalizeCodeBundle(input.problemCode);
  }

  if (!isUpdate || input.isActive !== undefined) {
    value.isActive = parseBoolean(input.isActive, true);
  }

  if (!isUpdate || input.submissionsCount !== undefined || input.submissionCount !== undefined) {
    value.submissionsCount = parseNonNegativeNumber(
      input.submissionsCount ?? input.submissionCount,
      0,
    );
  }

  if (!isUpdate || input.solvedCount !== undefined || input.acceptanceCount !== undefined) {
    value.solvedCount = parseNonNegativeNumber(
      input.solvedCount ?? input.acceptanceCount,
      0,
    );
  }

  return { value, errors };
};

const normalizeListItemTestCase = (testCase = {}) => ({
  input: toStringSafe(testCase.input),
  output: toStringSafe(testCase.output || testCase.expectedOutput),
  explanation: toStringSafe(testCase.explanation),
});

export const serializeProblemForAdmin = (problem, { includeHidden = true } = {}) => {
  const source = problem?.toObject ? problem.toObject() : problem || {};

  const submissionsCount = parseNonNegativeNumber(
    source.submissionsCount ?? source.submissionCount,
    0,
  );
  const solvedCount = parseNonNegativeNumber(
    source.solvedCount ?? source.acceptanceCount,
    0,
  );
  const acceptanceRate =
    submissionsCount > 0
      ? Number(((solvedCount / submissionsCount) * 100).toFixed(2))
      : 0;

  return {
    _id: source._id,
    title: source.title || "",
    slug: source.slug || "",
    description: source.description || "",
    difficulty: source.difficulty || "Easy",
    tags: Array.isArray(source.tags) ? source.tags : [],
    constraints: Array.isArray(source.constraints) ? source.constraints : [],
    hints: Array.isArray(source.hints) ? source.hints : [],
    examples: Array.isArray(source.examples)
      ? source.examples.map((example) => ({
          input: toStringSafe(example.input),
          output: toStringSafe(example.output),
          explanation: toStringSafe(example.explanation),
        }))
      : [],
    visibleTestCases: Array.isArray(source.visibleTestCases)
      ? source.visibleTestCases.map((testCase) => normalizeListItemTestCase(testCase))
      : [],
    hiddenTestCases:
      includeHidden && Array.isArray(source.hiddenTestCases)
        ? source.hiddenTestCases.map((testCase) => ({
            input: toStringSafe(testCase.input),
            output: toStringSafe(testCase.output || testCase.expectedOutput),
          }))
        : [],
    supportedLanguages: Array.isArray(source.supportedLanguages)
      ? source.supportedLanguages
      : DEFAULT_LANGUAGES,
    starterCode: {
      javascript: toStringSafe(source.starterCode?.javascript),
      python: toStringSafe(source.starterCode?.python),
      java: toStringSafe(source.starterCode?.java),
      cpp: toStringSafe(source.starterCode?.cpp),
    },
    referenceSolution: {
      javascript: toStringSafe(source.referenceSolution?.javascript),
      python: toStringSafe(source.referenceSolution?.python),
      java: toStringSafe(source.referenceSolution?.java),
      cpp: toStringSafe(source.referenceSolution?.cpp),
    },
    problemCode: {
      javascript: toStringSafe(source.problemCode?.javascript),
      python: toStringSafe(source.problemCode?.python),
      java: toStringSafe(source.problemCode?.java),
      cpp: toStringSafe(source.problemCode?.cpp),
    },
    submissionsCount,
    solvedCount,
    acceptanceRate,
    submissionCount: submissionsCount,
    acceptanceCount: solvedCount,
    isActive: Boolean(source.isActive),
    createdBy: source.createdBy || null,
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
};

export const serializeProblemListItemForAdmin = (problem) => {
  const source = serializeProblemForAdmin(problem, { includeHidden: false });

  return {
    _id: source._id,
    title: source.title,
    slug: source.slug,
    difficulty: source.difficulty,
    tags: source.tags,
    isActive: source.isActive,
    submissionsCount: source.submissionsCount,
    solvedCount: source.solvedCount,
    acceptanceRate: source.acceptanceRate,
    submissionCount: source.submissionCount,
    acceptanceCount: source.acceptanceCount,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

export const ensureValidObjectId = (id, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};
