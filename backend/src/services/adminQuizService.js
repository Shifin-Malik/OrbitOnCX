import mongoose from "mongoose";
import Quiz from "../models/QuizModel.js";
import Question from "../models/QuestionModel.js";
import {
  isObjectLike,
  parseJsonIfString,
  normalizeQuizInput,
} from "../validators/quizAdminValidator.js";

const isString = (value) => typeof value === "string";

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseRequestPayload = (rawBody = {}) => {
  const parsedBody = parseJsonIfString(rawBody);
  const body = isObjectLike(parsedBody) ? parsedBody : {};

  const quizDataField = parseJsonIfString(body.quizData);
  const quizData = isObjectLike(quizDataField)
    ? { ...body, ...quizDataField }
    : { ...body };

  delete quizData.quizData;

  const questionsField = parseJsonIfString(body.questions);

  let questions = [];
  let hasQuestions = false;

  if (Array.isArray(questionsField)) {
    questions = questionsField;
    hasQuestions = true;
  } else if (Array.isArray(quizData.questions)) {
    questions = quizData.questions;
    hasQuestions = true;
  }

  delete quizData.questions;

  return {
    quizData,
    questions,
    hasQuestions,
  };
};

export const parseBulkQuizItems = (rawItems) => {
  const parsed = parseJsonIfString(rawItems);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((item) => {
    const payload = parseRequestPayload(item);
    return {
      quizData: payload.quizData,
      questions: payload.questions,
    };
  });
};

export const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const normalizePagination = (query = {}) => {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 20), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildQuizListMatch = (query = {}) => {
  const match = {};
  const search = isString(query.search) ? query.search.trim() : "";

  if (search) {
    const safe = escapeRegex(search);
    const regex = new RegExp(safe, "i");
    match.$or = [{ title: regex }, { description: regex }];
  }

  if (query.category && query.category !== "all") {
    match.category = query.category;
  }

  if (query.difficulty && query.difficulty !== "all") {
    match.difficulty = query.difficulty;
  }

  if (query.status && query.status !== "all") {
    const normalized = String(query.status).toLowerCase();
    if (normalized === "active") match.isActive = true;
    if (normalized === "inactive") match.isActive = false;
  }

  return match;
};

export const ensureValidObjectId = (value, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error(`Invalid ${label}`);
    error.statusCode = 400;
    throw error;
  }
};

export const recomputeQuizQuestionCount = async (quizId) => {
  const totalQuestions = await Question.countDocuments({ quizId });
  await Quiz.findByIdAndUpdate(quizId, { $set: { totalQuestions } });
  return totalQuestions;
};

export const appendQuestionsToQuiz = async (quizId, questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return [];
  }

  const docs = questions.map((question) => {
    const { _id, quizId: ignoredQuizId, ...rest } = question;
    return {
      ...rest,
      quizId,
    };
  });

  const created = await Question.insertMany(docs, { ordered: true });
  await recomputeQuizQuestionCount(quizId);
  return created;
};

export const syncQuizQuestions = async (quizId, incomingQuestions = []) => {
  const existing = await Question.find({ quizId })
    .select("_id")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const existingIdSet = new Set(existing.map((item) => String(item._id)));
  const keepIds = new Set();

  const updateOps = [];
  const insertDocs = [];
  const foreignIds = [];

  incomingQuestions.forEach((question) => {
    if (question._id) {
      const id = String(question._id);
      if (!existingIdSet.has(id)) {
        foreignIds.push(id);
        return;
      }

      keepIds.add(id);

      const { _id, quizId: ignoredQuizId, ...rest } = question;
      updateOps.push({
        updateOne: {
          filter: { _id: id, quizId },
          update: { $set: rest },
        },
      });
      return;
    }

    const { _id, quizId: ignoredQuizId, ...rest } = question;
    insertDocs.push({
      ...rest,
      quizId,
    });
  });

  if (foreignIds.length > 0) {
    throw new Error(
      `Some question ids do not belong to this quiz: ${foreignIds.join(", ")}`,
    );
  }

  if (updateOps.length > 0) {
    await Question.bulkWrite(updateOps, { ordered: false });
  }

  if (insertDocs.length > 0) {
    await Question.insertMany(insertDocs, { ordered: true });
  }

  const deleteIds = existing
    .map((item) => String(item._id))
    .filter((id) => !keepIds.has(id));

  if (deleteIds.length > 0) {
    await Question.deleteMany({
      _id: { $in: deleteIds.map((id) => new mongoose.Types.ObjectId(id)) },
      quizId,
    });
  }

  const totalQuestions = await recomputeQuizQuestionCount(quizId);
  const questions = await Question.find({ quizId }).sort({ createdAt: 1 }).lean();

  return {
    totalQuestions,
    questions,
    stats: {
      inserted: insertDocs.length,
      updated: updateOps.length,
      deleted: deleteIds.length,
    },
  };
};

export const findDuplicateQuizTitles = async (titles = []) => {
  if (!Array.isArray(titles) || titles.length === 0) {
    return new Set();
  }

  const uniqueTitles = [...new Set(titles.map((title) => title.trim()))];
  const existing = await Quiz.find({ title: { $in: uniqueTitles } })
    .collation({ locale: "en", strength: 2 })
    .select("title")
    .lean();

  return new Set(existing.map((quiz) => normalizeQuizInput(quiz).title.toLowerCase()));
};
