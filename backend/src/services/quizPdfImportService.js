import { PDFParse } from "pdf-parse";
import {
  QUIZ_DIFFICULTIES,
  normalizeQuestionInput,
  validateQuestionInput,
} from "../validators/quizAdminValidator.js";

const QUESTION_START_REGEX =
  /^(?:(?:q(?:uestion)?)\s*)?\d+\s*[\).:-]\s+.+/i;
const QUESTION_PREFIX_CLEANUP_REGEX =
  /^(?:(?:q(?:uestion)?)\s*)?\d+\s*[\).:-]\s*/i;
const QUESTION_TEXT_PREFIX_REGEX = /^q(?:uestion)?\s*[:\-]\s*/i;
const OPTION_REGEX = /^\(?([A-D])\)?\s*[\).:-]\s*(.+)$/i;
const ANSWER_REGEX = /^(?:ans(?:wer)?|correct\s*answer)\s*[:\-]\s*(.+)$/i;
const EXPLANATION_REGEX = /^explanation\s*[:\-]\s*(.+)$/i;
const DIFFICULTY_REGEX =
  /^difficulty\s*[:\-]\s*(easy|medium|advanced)\s*$/i;
const BULLET_OPTION_REGEX = /^[-*•]\s*(.+)$/;

const normalizeWhitespace = (value) =>
  String(value || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();

const toComparable = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const cleanQuestionLine = (line) =>
  line.replace(QUESTION_PREFIX_CLEANUP_REGEX, "").replace(QUESTION_TEXT_PREFIX_REGEX, "").trim();

const looksLikeQuestionStart = (line) =>
  QUESTION_START_REGEX.test(line) || QUESTION_TEXT_PREFIX_REGEX.test(line);

const getLinesFromText = (text) =>
  normalizeWhitespace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const splitIntoQuestionBlocks = (text) => {
  const normalized = normalizeWhitespace(text);
  const lines = getLinesFromText(normalized);

  if (!lines.length) return [];

  const blocks = [];
  let current = [];

  lines.forEach((line) => {
    if (looksLikeQuestionStart(line) && current.length > 0) {
      blocks.push(current);
      current = [line];
      return;
    }

    current.push(line);
  });

  if (current.length > 0) {
    blocks.push(current);
  }

  if (blocks.length > 1) {
    return blocks;
  }

  const paragraphBlocks = normalized
    .split(/\n\s*\n+/)
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((chunk) => chunk.length > 0);

  return paragraphBlocks.length > 1 ? paragraphBlocks : blocks;
};

const resolveOptions = (optionMap, lines) => {
  if (optionMap.size === 4) {
    return ["A", "B", "C", "D"].map((key) => optionMap.get(key) || "");
  }

  const bulletOptions = lines
    .map((line) => line.match(BULLET_OPTION_REGEX))
    .filter(Boolean)
    .map((match) => (match?.[1] || "").trim())
    .filter(Boolean);

  if (bulletOptions.length === 4) {
    return bulletOptions;
  }

  return ["A", "B", "C", "D"].map((key) => optionMap.get(key) || "");
};

const resolveCorrectAnswer = (answerText, options) => {
  const raw = String(answerText || "").trim();
  if (!raw) return "";

  if (/^[A-D]$/i.test(raw)) {
    const index = raw.toUpperCase().charCodeAt(0) - 65;
    return options[index] || "";
  }

  const cleaned = raw.replace(/^\(?([A-D])\)?\s*[\).:-]\s*/i, "").trim();
  const comparable = toComparable(cleaned);

  const exact = options.find((option) => toComparable(option) === comparable);
  if (exact) return exact;

  return "";
};

const parseSingleQuestionBlock = (lines, index, defaultDifficulty = "Easy") => {
  const optionMap = new Map();
  const questionParts = [];

  let answerText = "";
  let explanation = "";
  let difficulty = defaultDifficulty;
  let activeOption = null;
  let captureExplanation = false;

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;

    const parsedDifficulty = line.match(DIFFICULTY_REGEX);
    if (parsedDifficulty) {
      difficulty = parsedDifficulty[1][0].toUpperCase() + parsedDifficulty[1].slice(1).toLowerCase();
      activeOption = null;
      captureExplanation = false;
      return;
    }

    const parsedAnswer = line.match(ANSWER_REGEX);
    if (parsedAnswer) {
      answerText = parsedAnswer[1].trim();
      activeOption = null;
      captureExplanation = false;
      return;
    }

    const parsedExplanation = line.match(EXPLANATION_REGEX);
    if (parsedExplanation) {
      explanation = parsedExplanation[1].trim();
      activeOption = null;
      captureExplanation = true;
      return;
    }

    const parsedOption = line.match(OPTION_REGEX);
    if (parsedOption) {
      const key = parsedOption[1].toUpperCase();
      optionMap.set(key, parsedOption[2].trim());
      activeOption = key;
      captureExplanation = false;
      return;
    }

    if (captureExplanation) {
      explanation = `${explanation} ${line}`.trim();
      return;
    }

    if (activeOption && optionMap.has(activeOption)) {
      optionMap.set(activeOption, `${optionMap.get(activeOption)} ${line}`.trim());
      return;
    }

    if (lineIndex === 0) {
      questionParts.push(cleanQuestionLine(line));
      return;
    }

    questionParts.push(line);
  });

  const options = resolveOptions(optionMap, lines);
  const questionInput = normalizeQuestionInput({
    q: questionParts.join(" ").trim(),
    options,
    correctAnswer: resolveCorrectAnswer(answerText, options),
    difficulty: QUIZ_DIFFICULTIES.includes(difficulty) ? difficulty : defaultDifficulty,
    explanation,
  });

  const validation = validateQuestionInput(questionInput, {
    pathPrefix: `questions[${index}]`,
    allowId: false,
  });

  return {
    index,
    raw: lines.join("\n"),
    question: questionInput,
    errors: validation.errors,
  };
};

export const extractTextFromPdfBuffer = async (buffer) => {
  if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
    throw new Error("Invalid PDF buffer.");
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText({});
    const text = String(result?.text || "").trim();

    if (!text) {
      throw new Error("No readable text found in the uploaded PDF.");
    }

    return text;
  } finally {
    await parser.destroy();
  }
};

export const parseQuizQuestionsFromText = (
  text,
  { defaultDifficulty = "Easy" } = {},
) => {
  const safeDifficulty = QUIZ_DIFFICULTIES.includes(defaultDifficulty)
    ? defaultDifficulty
    : "Easy";

  const blocks = splitIntoQuestionBlocks(text);

  const validQuestions = [];
  const invalidItems = [];

  blocks.forEach((block, index) => {
    const parsed = parseSingleQuestionBlock(block, index, safeDifficulty);

    if (parsed.errors.length > 0) {
      invalidItems.push({
        index,
        raw: parsed.raw,
        errors: parsed.errors,
      });
      return;
    }

    validQuestions.push(parsed.question);
  });

  return {
    questions: validQuestions,
    invalidItems,
    meta: {
      totalDetected: blocks.length,
      validCount: validQuestions.length,
      invalidCount: invalidItems.length,
    },
  };
};

