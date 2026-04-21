import mongoose from "mongoose";

export const QUIZ_CATEGORIES = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "MongoDB",
  "CSS",
  "Full-Stack",
  "Python",
  "Go",
];

export const QUIZ_DIFFICULTIES = ["Easy", "Medium", "Advanced"];

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);
const FALSE_VALUES = new Set(["false", "0", "no", "off"]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const parseJsonIfString = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return value;

  const looksLikeJson =
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));

  if (!looksLikeJson) return value;

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

export const parseBoolean = (value, fallback = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return fallback;

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
};

const parseFiniteNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

const normalizeOptions = (value) => {
  const parsed = parseJsonIfString(value);

  if (Array.isArray(parsed)) {
    return parsed.map((option) => toTrimmedString(option));
  }

  if (isPlainObject(parsed)) {
    const ordered = ["A", "B", "C", "D"].map((key) =>
      toTrimmedString(parsed[key] ?? parsed[key.toLowerCase()]),
    );
    if (ordered.some(Boolean)) return ordered;
  }

  if (typeof parsed === "string" && parsed.includes("\n")) {
    return parsed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeCorrectAnswer = (value, options, correctOption = "") => {
  const normalizedCorrectOption = toTrimmedString(correctOption).toUpperCase();
  if (/^[A-D]$/.test(normalizedCorrectOption) && options.length >= 4) {
    const optionIndex = normalizedCorrectOption.charCodeAt(0) - 65;
    if (options[optionIndex]) {
      return options[optionIndex];
    }
  }

  const raw = toTrimmedString(value);
  if (!raw) return "";

  if (/^[A-D]$/i.test(raw) && options.length >= 4) {
    const index = raw.toUpperCase().charCodeAt(0) - 65;
    return options[index] || "";
  }

  const found = options.find(
    (option) => option.toLowerCase() === raw.toLowerCase(),
  );
  return found || raw;
};

export const normalizeQuizInput = (raw = {}) => {
  const parsed = parseJsonIfString(raw);
  const source = isPlainObject(parsed) ? parsed : {};

  return {
    title: toTrimmedString(source.title),
    description: toTrimmedString(source.description),
    category: toTrimmedString(source.category),
    difficulty: toTrimmedString(source.difficulty) || "Easy",
    xpPotential: parseFiniteNumber(source.xpPotential, 1000),
    timeLimit: parseFiniteNumber(source.timeLimit, 600),
    thumbnail: toTrimmedString(source.thumbnail),
    isActive: parseBoolean(source.isActive, true),
  };
};

export const normalizeQuestionInput = (raw = {}) => {
  const parsed = parseJsonIfString(raw);
  const source = isPlainObject(parsed) ? parsed : {};

  const options = normalizeOptions(source.options ?? source.choices);
  const correctOption = toTrimmedString(source.correctOption).toUpperCase();

  return {
    _id: source._id || source.id || null,
    q: toTrimmedString(source.q || source.question || source.questionText),
    options,
    correctAnswer: normalizeCorrectAnswer(
      source.correctAnswer ?? source.answer,
      options,
      correctOption,
    ),
    correctOption: /^[A-D]$/.test(correctOption) ? correctOption : "",
    difficulty: toTrimmedString(source.difficulty) || "Easy",
    explanation: toTrimmedString(source.explanation),
  };
};

export const validateQuizInput = (
  rawQuiz,
  { requireAllRequiredFields = true, pathPrefix = "quiz" } = {},
) => {
  const quiz = normalizeQuizInput(rawQuiz);
  const errors = [];

  if (requireAllRequiredFields || quiz.title) {
    if (!quiz.title) {
      errors.push(`${pathPrefix}.title is required.`);
    } else if (quiz.title.length < 3) {
      errors.push(`${pathPrefix}.title must be at least 3 characters.`);
    }
  }

  if (requireAllRequiredFields || quiz.category) {
    if (!quiz.category) {
      errors.push(`${pathPrefix}.category is required.`);
    } else if (!QUIZ_CATEGORIES.includes(quiz.category)) {
      errors.push(
        `${pathPrefix}.category must be one of: ${QUIZ_CATEGORIES.join(", ")}.`,
      );
    }
  }

  if (requireAllRequiredFields || quiz.difficulty) {
    if (!QUIZ_DIFFICULTIES.includes(quiz.difficulty)) {
      errors.push(
        `${pathPrefix}.difficulty must be one of: ${QUIZ_DIFFICULTIES.join(", ")}.`,
      );
    }
  }

  if (!Number.isInteger(quiz.timeLimit) || quiz.timeLimit <= 0) {
    errors.push(`${pathPrefix}.timeLimit must be a positive integer.`);
  }

  if (!Number.isInteger(quiz.xpPotential) || quiz.xpPotential < 0) {
    errors.push(`${pathPrefix}.xpPotential must be a non-negative integer.`);
  }

  return { value: quiz, errors };
};

export const validateQuestionInput = (
  rawQuestion,
  { pathPrefix = "question", allowId = true } = {},
) => {
  const question = normalizeQuestionInput(rawQuestion);
  const errors = [];

  if (allowId && question._id && !mongoose.Types.ObjectId.isValid(question._id)) {
    errors.push(`${pathPrefix}._id is invalid.`);
  }

  if (!question.q) {
    errors.push(`${pathPrefix}.q is required.`);
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    errors.push(`${pathPrefix}.options must contain exactly 4 items.`);
  } else {
    const emptyIndex = question.options.findIndex((option) => !option);
    if (emptyIndex >= 0) {
      errors.push(`${pathPrefix}.options[${emptyIndex}] cannot be empty.`);
    }

    const normalizedOptions = question.options.map((option) =>
      option.toLowerCase(),
    );
    const uniqueCount = new Set(normalizedOptions).size;
    if (uniqueCount !== question.options.length) {
      errors.push(`${pathPrefix}.options must be unique.`);
    }
  }

  if (!question.correctAnswer) {
    errors.push(`${pathPrefix}.correctAnswer is required.`);
  } else if (
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    !question.options.includes(question.correctAnswer)
  ) {
    errors.push(`${pathPrefix}.correctAnswer must match one of the options.`);
  }

  if (!QUIZ_DIFFICULTIES.includes(question.difficulty)) {
    errors.push(
      `${pathPrefix}.difficulty must be one of: ${QUIZ_DIFFICULTIES.join(", ")}.`,
    );
  }

  return { value: question, errors };
};

export const validateQuestionsArray = (
  rawQuestions,
  { pathPrefix = "questions", allowEmpty = true } = {},
) => {
  const parsed = parseJsonIfString(rawQuestions);
  const errors = [];

  if (!Array.isArray(parsed)) {
    return {
      value: [],
      errors: [`${pathPrefix} must be an array.`],
    };
  }

  if (!allowEmpty && parsed.length === 0) {
    return {
      value: [],
      errors: [`${pathPrefix} must include at least one question.`],
    };
  }

  const value = [];
  parsed.forEach((question, index) => {
    const result = validateQuestionInput(question, {
      pathPrefix: `${pathPrefix}[${index}]`,
    });
    if (result.errors.length) {
      errors.push(...result.errors);
      return;
    }

    value.push(result.value);
  });

  return { value, errors };
};

export const isObjectLike = isPlainObject;
