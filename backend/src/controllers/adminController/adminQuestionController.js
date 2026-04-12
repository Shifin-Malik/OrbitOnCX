import asyncHandler from "express-async-handler";
import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";
import {
  appendQuestionsToQuiz,
  ensureValidObjectId,
  parseRequestPayload,
  recomputeQuizQuestionCount,
} from "../../services/adminQuizService.js";
import {
  parseJsonIfString,
  validateQuestionInput,
  validateQuestionsArray,
} from "../../validators/quizAdminValidator.js";

const normalizeQuizIdFromRequest = (req) => {
  const bodyQuizId = req.body?.quizId;
  const parsedQuestions = parseJsonIfString(req.body?.questions);
  const firstQuestionQuizId = Array.isArray(parsedQuestions)
    ? parsedQuestions[0]?.quizId
    : null;
  return req.params.quizId || bodyQuizId || firstQuestionQuizId || null;
};

const respondValidationError = (res, errors) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });

export const addQuestionToQuiz = asyncHandler(async (req, res) => {
  const quizId = normalizeQuizIdFromRequest(req);
  if (!quizId) {
    res.status(400);
    throw new Error("quizId is required");
  }

  ensureValidObjectId(quizId, "quiz id");

  const quiz = await Quiz.findById(quizId).select("_id");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  const payload = parseJsonIfString(req.body?.question) || req.body;
  const validation = validateQuestionInput(payload, {
    pathPrefix: "question",
  });

  if (validation.errors.length > 0) {
    return respondValidationError(res, validation.errors);
  }

  const created = await appendQuestionsToQuiz(quiz._id, [validation.value]);

  return res.status(201).json({
    success: true,
    message: "Question created successfully",
    data: created[0],
  });
});

export const bulkAddQuestions = asyncHandler(async (req, res) => {
  const quizId = normalizeQuizIdFromRequest(req);
  if (!quizId) {
    res.status(400);
    throw new Error("quizId is required");
  }

  ensureValidObjectId(quizId, "quiz id");

  const quiz = await Quiz.findById(quizId).select("_id");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  const parsedBody = parseRequestPayload(req.body);
  const incomingQuestions =
    parsedBody.hasQuestions && Array.isArray(parsedBody.questions)
      ? parsedBody.questions
      : parseJsonIfString(req.body?.questions);

  const validation = validateQuestionsArray(incomingQuestions, {
    pathPrefix: "questions",
    allowEmpty: false,
  });

  if (validation.errors.length > 0) {
    return respondValidationError(res, validation.errors);
  }

  const created = await appendQuestionsToQuiz(quiz._id, validation.value);

  return res.status(201).json({
    success: true,
    message: "Questions created successfully",
    count: created.length,
    data: created,
  });
});

export const getQuestionsByQuiz = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.quizId, "quiz id");

  const questions = await Question.find({ quizId: req.params.quizId })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    count: questions.length,
    data: questions,
  });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "question id");

  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  const rawBody = parseJsonIfString(req.body);
  const incoming = rawBody && typeof rawBody === "object" ? rawBody : {};

  const mergedInput = {
    q: incoming.q !== undefined ? incoming.q : question.q,
    options: incoming.options !== undefined ? incoming.options : question.options,
    correctAnswer:
      incoming.correctAnswer !== undefined
        ? incoming.correctAnswer
        : question.correctAnswer,
    difficulty:
      incoming.difficulty !== undefined ? incoming.difficulty : question.difficulty,
    explanation:
      incoming.explanation !== undefined
        ? incoming.explanation
        : question.explanation,
  };

  const validation = validateQuestionInput(mergedInput, {
    pathPrefix: "question",
    allowId: false,
  });

  if (validation.errors.length > 0) {
    return respondValidationError(res, validation.errors);
  }

  question.q = validation.value.q;
  question.options = validation.value.options;
  question.correctAnswer = validation.value.correctAnswer;
  question.difficulty = validation.value.difficulty;
  question.explanation = validation.value.explanation;
  await question.save();

  return res.status(200).json({
    success: true,
    message: "Question updated successfully",
    data: question,
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "question id");

  const question = await Question.findById(req.params.id).select("_id quizId");
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  await Question.findByIdAndDelete(question._id);
  await recomputeQuizQuestionCount(question.quizId);

  return res.status(200).json({
    success: true,
    message: "Question removed successfully",
    data: { _id: question._id, quizId: question.quizId },
  });
});
