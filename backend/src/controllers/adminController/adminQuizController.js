import asyncHandler from "express-async-handler";
import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";
import {
  buildQuizListMatch,
  ensureValidObjectId,
  normalizePagination,
  parseRequestPayload,
  parseBulkQuizItems,
  appendQuestionsToQuiz,
  syncQuizQuestions,
  findDuplicateQuizTitles,
} from "../../services/adminQuizService.js";
import {
  QUIZ_DIFFICULTIES,
  parseBoolean,
  validateQuestionsArray,
  validateQuizInput,
} from "../../validators/quizAdminValidator.js";
import {
  extractTextFromPdfBuffer,
  parseQuizQuestionsFromText,
} from "../../services/quizPdfImportService.js";

const respondValidationError = (res, errors) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });

const fetchQuizWithQuestions = async (quizId) => {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) return null;

  const questions = await Question.find({ quizId: quiz._id })
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  return {
    ...quiz,
    questions,
  };
};

const summarizeInvalidItems = (items = []) =>
  items.map((item) => ({
    index: item.index,
    errors: item.errors,
    rawPreview:
      item.raw?.length > 280
        ? `${item.raw.slice(0, 280)}...`
        : item.raw || "",
  }));

const resolveMergedQuizInput = (existingQuiz, incoming = {}, filePath = "") => ({
  title: incoming.title !== undefined ? incoming.title : existingQuiz.title,
  description:
    incoming.description !== undefined
      ? incoming.description
      : existingQuiz.description,
  category:
    incoming.category !== undefined ? incoming.category : existingQuiz.category,
  difficulty:
    incoming.difficulty !== undefined
      ? incoming.difficulty
      : existingQuiz.difficulty,
  xpPotential:
    incoming.xpPotential !== undefined
      ? incoming.xpPotential
      : existingQuiz.xpPotential,
  timeLimit:
    incoming.timeLimit !== undefined ? incoming.timeLimit : existingQuiz.timeLimit,
  thumbnail:
    filePath || incoming.thumbnail !== undefined
      ? filePath || incoming.thumbnail
      : existingQuiz.thumbnail,
  isActive:
    incoming.isActive !== undefined ? incoming.isActive : existingQuiz.isActive,
});

export const createQuiz = asyncHandler(async (req, res) => {
  const { quizData, questions, hasQuestions } = parseRequestPayload(req.body);

  if (req.file?.path) {
    quizData.thumbnail = req.file.path;
  }

  const quizValidation = validateQuizInput(quizData, {
    requireAllRequiredFields: true,
    pathPrefix: "quiz",
  });

  const questionValidation = hasQuestions
    ? validateQuestionsArray(questions, {
        pathPrefix: "questions",
        allowEmpty: true,
      })
    : { value: [], errors: [] };

  const errors = [...quizValidation.errors, ...questionValidation.errors];
  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  const duplicateQuiz = await Quiz.findOne({ title: quizValidation.value.title })
    .collation({ locale: "en", strength: 2 })
    .select("_id title");

  if (duplicateQuiz) {
    return res.status(409).json({
      success: false,
      message: `Quiz title "${quizValidation.value.title}" already exists.`,
    });
  }

  const createdQuiz = await Quiz.create({
    ...quizValidation.value,
    createdBy: req.user._id,
  });

  if (questionValidation.value.length > 0) {
    await appendQuestionsToQuiz(createdQuiz._id, questionValidation.value);
  }

  const hydrated = await fetchQuizWithQuestions(createdQuiz._id);

  return res.status(201).json({
    success: true,
    message: "Quiz created successfully",
    data: hydrated,
  });
});

export const getAllQuizzes = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const match = buildQuizListMatch(req.query);

  const [quizzes, total] = await Promise.all([
    Quiz.find(match)
      .populate("createdBy", "_id name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments(match),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return res.status(200).json({
    success: true,
    count: quizzes.length,
    total,
    pagination: {
      page,
      limit,
      totalPages,
    },
    data: quizzes,
  });
});

export const getQuizById = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "quiz id");

  const includeQuestions =
    String(req.query.includeQuestions || "true").toLowerCase() !== "false";

  const quiz = await Quiz.findById(req.params.id)
    .populate("createdBy", "_id name email")
    .lean();

  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  let questions = [];
  if (includeQuestions) {
    questions = await Question.find({ quizId: quiz._id })
      .sort({ createdAt: 1, _id: 1 })
      .lean();
  }

  return res.status(200).json({
    success: true,
    data: {
      ...quiz,
      questions,
    },
  });
});

export const updateQuiz = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "quiz id");

  const existingQuiz = await Quiz.findById(req.params.id);
  if (!existingQuiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  const { quizData, questions, hasQuestions } = parseRequestPayload(req.body);
  const mergedInput = resolveMergedQuizInput(
    existingQuiz,
    quizData,
    req.file?.path || "",
  );

  const quizValidation = validateQuizInput(mergedInput, {
    requireAllRequiredFields: true,
    pathPrefix: "quiz",
  });

  const questionValidation = hasQuestions
    ? validateQuestionsArray(questions, {
        pathPrefix: "questions",
        allowEmpty: true,
      })
    : { value: [], errors: [] };

  const errors = [...quizValidation.errors, ...questionValidation.errors];
  if (errors.length > 0) {
    return respondValidationError(res, errors);
  }

  const titleChanged =
    String(existingQuiz.title).trim().toLowerCase() !==
    quizValidation.value.title.toLowerCase();

  if (titleChanged) {
    const duplicateQuiz = await Quiz.findOne({
      title: quizValidation.value.title,
      _id: { $ne: existingQuiz._id },
    })
      .collation({ locale: "en", strength: 2 })
      .select("_id title");

    if (duplicateQuiz) {
      return res.status(409).json({
        success: false,
        message: `Quiz title "${quizValidation.value.title}" already exists.`,
      });
    }
  }

  existingQuiz.set(quizValidation.value);
  await existingQuiz.save();

  let questionSync = null;
  if (hasQuestions) {
    questionSync = await syncQuizQuestions(existingQuiz._id, questionValidation.value);
  }

  const refreshedQuiz = await fetchQuizWithQuestions(existingQuiz._id);

  return res.status(200).json({
    success: true,
    message: "Quiz updated successfully",
    data: refreshedQuiz,
    questionSync: questionSync?.stats || undefined,
  });
});

export const deleteQuiz = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "quiz id");

  const quiz = await Quiz.findById(req.params.id).select("_id title");
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  await Question.deleteMany({ quizId: quiz._id });
  await Quiz.findByIdAndDelete(quiz._id);

  return res.status(200).json({
    success: true,
    message: "Quiz and related questions deleted successfully",
    data: {
      _id: quiz._id,
      title: quiz.title,
    },
  });
});

export const toggleQuizStatus = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "quiz id");

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404);
    throw new Error("Quiz not found");
  }

  const explicitValue = req.body?.isActive;
  if (explicitValue === undefined) {
    quiz.isActive = !quiz.isActive;
  } else {
    quiz.isActive = parseBoolean(explicitValue, quiz.isActive);
  }

  await quiz.save();

  return res.status(200).json({
    success: true,
    message: `Quiz marked as ${quiz.isActive ? "active" : "inactive"}.`,
    data: quiz,
  });
});

export const bulkCreateQuizzes = asyncHandler(async (req, res) => {
  const rawItems = req.body?.quizzes ?? req.body;
  const items = parseBulkQuizItems(rawItems);

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "quizzes must be a non-empty array.",
    });
  }

  const failed = [];
  const validItems = [];

  items.forEach((item, index) => {
    const quizValidation = validateQuizInput(item.quizData, {
      requireAllRequiredFields: true,
      pathPrefix: `quizzes[${index}]`,
    });

    const questionValidation = validateQuestionsArray(item.questions || [], {
      pathPrefix: `quizzes[${index}].questions`,
      allowEmpty: true,
    });

    const errors = [...quizValidation.errors, ...questionValidation.errors];
    if (errors.length > 0) {
      failed.push({
        index,
        title: quizValidation.value.title || null,
        errors,
      });
      return;
    }

    validItems.push({
      index,
      quiz: quizValidation.value,
      questions: questionValidation.value,
    });
  });

  const seenTitles = new Map();
  const deduped = [];
  validItems.forEach((item) => {
    const key = item.quiz.title.toLowerCase();
    if (seenTitles.has(key)) {
      failed.push({
        index: item.index,
        title: item.quiz.title,
        errors: [
          `Duplicate title in payload (same as quizzes[${seenTitles.get(key)}]).`,
        ],
      });
      return;
    }

    seenTitles.set(key, item.index);
    deduped.push(item);
  });

  const existingDuplicateTitles = await findDuplicateQuizTitles(
    deduped.map((item) => item.quiz.title),
  );

  const insertable = [];
  deduped.forEach((item) => {
    const key = item.quiz.title.toLowerCase();
    if (existingDuplicateTitles.has(key)) {
      failed.push({
        index: item.index,
        title: item.quiz.title,
        errors: ["Quiz title already exists."],
      });
      return;
    }

    insertable.push(item);
  });

  let createdQuizzes = [];

  if (insertable.length > 0) {
    const quizDocs = insertable.map((item) => ({
      ...item.quiz,
      createdBy: req.user._id,
    }));

    createdQuizzes = await Quiz.insertMany(quizDocs, { ordered: true });

    const questionDocs = [];
    const countByQuizId = new Map();

    createdQuizzes.forEach((quizDoc, index) => {
      const source = insertable[index];
      const cleanedQuestions = source.questions.map((question) => {
        const { _id, quizId: ignoredQuizId, ...rest } = question;
        return {
          ...rest,
          quizId: quizDoc._id,
        };
      });

      countByQuizId.set(String(quizDoc._id), cleanedQuestions.length);
      questionDocs.push(...cleanedQuestions);
    });

    if (questionDocs.length > 0) {
      await Question.insertMany(questionDocs, { ordered: true });
    }

    if (createdQuizzes.length > 0) {
      await Quiz.bulkWrite(
        createdQuizzes.map((quizDoc) => ({
          updateOne: {
            filter: { _id: quizDoc._id },
            update: {
              $set: {
                totalQuestions: countByQuizId.get(String(quizDoc._id)) || 0,
              },
            },
          },
        })),
      );
    }
  }

  const created = createdQuizzes.map((quizDoc, index) => ({
    index: insertable[index].index,
    _id: quizDoc._id,
    title: quizDoc.title,
    totalQuestions: insertable[index].questions.length,
  }));

  const successCount = created.length;
  const failedCount = failed.length;
  const total = items.length;

  const statusCode = successCount > 0 ? 201 : 400;

  return res.status(statusCode).json({
    success: successCount > 0,
    message:
      successCount > 0
        ? "Bulk quiz operation completed."
        : "No quizzes were created.",
    summary: {
      total,
      successCount,
      failedCount,
    },
    created,
    failed,
  });
});

export const previewQuizPdfImport = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({
      success: false,
      message: "PDF file is required.",
    });
  }

  const defaultDifficulty = QUIZ_DIFFICULTIES.includes(req.body?.defaultDifficulty)
    ? req.body.defaultDifficulty
    : "Easy";

  let targetQuiz = null;
  if (req.body?.quizId) {
    ensureValidObjectId(req.body.quizId, "quiz id");
    targetQuiz = await Quiz.findById(req.body.quizId)
      .select("_id title category difficulty isActive")
      .lean();

    if (!targetQuiz) {
      res.status(404);
      throw new Error("Target quiz not found for PDF import.");
    }
  }

  let extractedText = "";
  try {
    extractedText = await extractTextFromPdfBuffer(req.file.buffer);
  } catch (error) {
    return res.status(422).json({
      success: false,
      message:
        error?.message || "Failed to extract readable text from uploaded PDF.",
    });
  }
  const parsed = parseQuizQuestionsFromText(extractedText, {
    defaultDifficulty,
  });

  if (parsed.questions.length === 0) {
    return res.status(422).json({
      success: false,
      message: "No valid MCQ questions could be parsed from this PDF.",
      data: {
        ...parsed.meta,
        invalidItems: summarizeInvalidItems(parsed.invalidItems),
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "PDF parsed successfully. Review preview before saving.",
    data: {
      targetQuiz,
      questions: parsed.questions,
      meta: parsed.meta,
      invalidItems: summarizeInvalidItems(parsed.invalidItems),
    },
  });
});

export const commitQuizPdfImport = asyncHandler(async (req, res) => {
  const parsedPayload = parseRequestPayload(req.body);

  const questionValidation = validateQuestionsArray(parsedPayload.questions, {
    pathPrefix: "questions",
    allowEmpty: false,
  });

  if (questionValidation.errors.length > 0) {
    return respondValidationError(res, questionValidation.errors);
  }

  if (req.body?.quizId) {
    ensureValidObjectId(req.body.quizId, "quiz id");

    const targetQuiz = await Quiz.findById(req.body.quizId);
    if (!targetQuiz) {
      res.status(404);
      throw new Error("Target quiz not found.");
    }

    const createdQuestions = await appendQuestionsToQuiz(
      targetQuiz._id,
      questionValidation.value,
    );
    const refreshed = await fetchQuizWithQuestions(targetQuiz._id);

    return res.status(201).json({
      success: true,
      message: "Parsed PDF questions saved to existing quiz.",
      data: refreshed,
      summary: {
        insertedQuestions: createdQuestions.length,
      },
    });
  }

  const quizValidation = validateQuizInput(parsedPayload.quizData, {
    requireAllRequiredFields: true,
    pathPrefix: "quiz",
  });

  if (quizValidation.errors.length > 0) {
    return respondValidationError(res, quizValidation.errors);
  }

  const duplicateQuiz = await Quiz.findOne({ title: quizValidation.value.title })
    .collation({ locale: "en", strength: 2 })
    .select("_id title");

  if (duplicateQuiz) {
    return res.status(409).json({
      success: false,
      message: `Quiz title "${quizValidation.value.title}" already exists.`,
    });
  }

  const createdQuiz = await Quiz.create({
    ...quizValidation.value,
    createdBy: req.user._id,
  });

  const createdQuestions = await appendQuestionsToQuiz(
    createdQuiz._id,
    questionValidation.value,
  );
  const hydrated = await fetchQuizWithQuestions(createdQuiz._id);

  return res.status(201).json({
    success: true,
    message: "Quiz created from PDF import successfully.",
    data: hydrated,
    summary: {
      insertedQuestions: createdQuestions.length,
    },
  });
});
