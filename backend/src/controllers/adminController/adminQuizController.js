import asyncHandler from "express-async-handler";
import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";
import {
  buildQuizListMatch,
  ensureValidObjectId,
  normalizePagination,
  parseRequestPayload,
  appendQuestionsToQuiz,
  syncQuizQuestions,
} from "../../services/adminQuizService.js";
import {
  QUIZ_CATEGORIES,
  QUIZ_DIFFICULTIES,
  parseBoolean,
  validateQuestionsArray,
  validateQuizInput,
} from "../../validators/quizAdminValidator.js";
import {
  OCR_FALLBACK_USED_WARNING,
  UNREADABLE_SCANNED_PDF_MESSAGE,
  extractQuizTextWithOcrFallback,
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

const normalizeImportMode = (value) =>
  String(value || "").trim().toLowerCase() === "publish" ? "publish" : "draft";

const resolveImportModeFromRequest = ({ mode, quizData, fallbackIsActive }) => {
  if (mode !== undefined) {
    return normalizeImportMode(mode);
  }

  if (quizData?.isActive !== undefined) {
    return parseBoolean(quizData.isActive, false) ? "publish" : "draft";
  }

  return fallbackIsActive ? "publish" : "draft";
};

const normalizeQuestionFingerprint = (question = {}) => {
  const normalize = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[ ]{2,}/g, " ");

  const q = normalize(question.q);
  const options = Array.isArray(question.options)
    ? question.options.map((option) => normalize(option)).join("||")
    : "";
  const answer = normalize(question.correctAnswer);

  return `${q}::${options}::${answer}`;
};

const dedupeQuestionsAgainstQuiz = async (quizId, questions = []) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return {
      uniqueQuestions: [],
      skippedDuplicateQuestions: 0,
    };
  }

  const existingQuestions = await Question.find({ quizId })
    .select("q options correctAnswer")
    .lean();

  const seen = new Set(
    existingQuestions
      .map((question) => normalizeQuestionFingerprint(question))
      .filter(Boolean),
  );

  const uniqueQuestions = [];
  let skippedDuplicateQuestions = 0;

  questions.forEach((question) => {
    const fingerprint = normalizeQuestionFingerprint(question);
    if (!fingerprint) {
      return;
    }

    if (seen.has(fingerprint)) {
      skippedDuplicateQuestions += 1;
      return;
    }

    seen.add(fingerprint);
    uniqueQuestions.push(question);
  });

  return {
    uniqueQuestions,
    skippedDuplicateQuestions,
  };
};

const dedupeQuestionList = (questions = []) => {
  const seen = new Set();
  const uniqueQuestions = [];
  let skippedDuplicateQuestions = 0;

  questions.forEach((question) => {
    const fingerprint = normalizeQuestionFingerprint(question);
    if (!fingerprint) {
      return;
    }

    if (seen.has(fingerprint)) {
      skippedDuplicateQuestions += 1;
      return;
    }

    seen.add(fingerprint);
    uniqueQuestions.push(question);
  });

  return {
    uniqueQuestions,
    skippedDuplicateQuestions,
  };
};

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
  let defaultCategory = QUIZ_CATEGORIES.includes(req.body?.defaultCategory)
    ? req.body.defaultCategory
    : "JavaScript";

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

    if (!QUIZ_CATEGORIES.includes(req.body?.defaultCategory)) {
      defaultCategory = targetQuiz.category || defaultCategory;
    }
  }

  let extractedText = "";
  let extractionWarnings = [];
  try {
    const extraction = await extractQuizTextWithOcrFallback(req.file.buffer);
    extractedText = extraction.text;
    extractionWarnings = Array.isArray(extraction.warnings)
      ? extraction.warnings
      : [];
  } catch (error) {
    return res.status(422).json({
      success: false,
      message:
        error?.message || "Failed to extract readable text from uploaded PDF.",
    });
  }
  const parsed = parseQuizQuestionsFromText(extractedText, {
    defaultDifficulty,
    defaultCategory,
  });
  const parserWarnings = Array.isArray(parsed.parseWarnings)
    ? parsed.parseWarnings
    : Array.isArray(parsed.warnings)
      ? parsed.warnings
      : [];
  const parseWarnings = [
    ...new Set([...extractionWarnings, ...parserWarnings].filter(Boolean)),
  ];

  if (parsed.questions.length === 0) {
    const usedOcrFallback = parseWarnings.some(
      (warning) => String(warning).trim() === OCR_FALLBACK_USED_WARNING,
    );
    const scannedWarning = parseWarnings.find((warning) =>
      String(warning)
        .toLowerCase()
        .includes("image-based or scanned"),
    );

    return res.status(422).json({
      success: false,
      message:
        scannedWarning && !usedOcrFallback
          ? UNREADABLE_SCANNED_PDF_MESSAGE
          : scannedWarning ||
        "No valid MCQ questions could be parsed from this PDF.",
      data: {
        quiz: parsed.quizData,
        quizData: parsed.quizData,
        questions: [],
        ...parsed.meta,
        parseWarnings,
        warnings: parseWarnings,
        invalidItems: summarizeInvalidItems(parsed.invalidItems),
      },
    });
  }

  return res.status(200).json({
    success: true,
    message: "PDF parsed successfully. Review preview before saving.",
    data: {
      targetQuiz,
      quiz: parsed.quizData,
      quizData: parsed.quizData,
      questions: parsed.questions,
      meta: parsed.meta,
      parseWarnings,
      warnings: parseWarnings,
      invalidItems: summarizeInvalidItems(parsed.invalidItems),
    },
  });
});

export const commitQuizPdfImport = asyncHandler(async (req, res) => {
  const parsedPayload = parseRequestPayload(req.body);
  const targetQuizId = req.body?.quizId;
  let targetQuiz = null;

  if (targetQuizId) {
    ensureValidObjectId(targetQuizId, "quiz id");
    targetQuiz = await Quiz.findById(targetQuizId);
    if (!targetQuiz) {
      res.status(404);
      throw new Error("Target quiz not found.");
    }
  }

  const importMode = resolveImportModeFromRequest({
    mode: req.body?.mode,
    quizData: parsedPayload.quizData,
    fallbackIsActive: targetQuiz?.isActive,
  });
  const shouldPublish = importMode === "publish";

  const questionValidation = validateQuestionsArray(parsedPayload.questions, {
    pathPrefix: "questions",
    allowEmpty: !shouldPublish,
  });

  if (questionValidation.errors.length > 0) {
    return respondValidationError(res, questionValidation.errors);
  }

  if (targetQuiz) {
    const hasQuizDataUpdate = [
      "title",
      "description",
      "category",
      "difficulty",
      "xpPotential",
      "timeLimit",
      "thumbnail",
      "isActive",
    ].some((field) => parsedPayload.quizData?.[field] !== undefined);

    if (hasQuizDataUpdate) {
      const mergedInput = resolveMergedQuizInput(targetQuiz, parsedPayload.quizData);
      const quizValidation = validateQuizInput(mergedInput, {
        requireAllRequiredFields: true,
        pathPrefix: "quiz",
      });

      if (quizValidation.errors.length > 0) {
        return respondValidationError(res, quizValidation.errors);
      }

      const titleChanged =
        String(targetQuiz.title).trim().toLowerCase() !==
        quizValidation.value.title.toLowerCase();

      if (titleChanged) {
        const duplicateQuiz = await Quiz.findOne({
          title: quizValidation.value.title,
          _id: { $ne: targetQuiz._id },
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

      targetQuiz.set(quizValidation.value);
    }

    const deduped = await dedupeQuestionsAgainstQuiz(
      targetQuiz._id,
      questionValidation.value,
    );

    const existingCount = await Question.countDocuments({ quizId: targetQuiz._id });
    if (shouldPublish && existingCount + deduped.uniqueQuestions.length === 0) {
      return respondValidationError(res, [
        "At least one valid question is required to publish a quiz.",
      ]);
    }

    targetQuiz.isActive = shouldPublish;
    await targetQuiz.save();

    let createdQuestions = [];
    if (deduped.uniqueQuestions.length > 0) {
      createdQuestions = await appendQuestionsToQuiz(
        targetQuiz._id,
        deduped.uniqueQuestions,
      );
    }

    const refreshed = await fetchQuizWithQuestions(targetQuiz._id);

    return res.status(201).json({
      success: true,
      message: "Parsed PDF questions saved to existing quiz.",
      data: refreshed,
      summary: {
        insertedQuestions: createdQuestions.length,
        skippedDuplicateQuestions: deduped.skippedDuplicateQuestions,
        mode: importMode,
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

  quizValidation.value.isActive = shouldPublish;

  const duplicateQuiz = await Quiz.findOne({ title: quizValidation.value.title })
    .collation({ locale: "en", strength: 2 })
    .select("_id title");

  if (duplicateQuiz) {
    return res.status(409).json({
      success: false,
      message: `Quiz title "${quizValidation.value.title}" already exists.`,
    });
  }

  const deduped = dedupeQuestionList(questionValidation.value);
  if (shouldPublish && deduped.uniqueQuestions.length === 0) {
    return respondValidationError(res, [
      "At least one valid question is required to publish a quiz.",
    ]);
  }

  const createdQuiz = await Quiz.create({
    ...quizValidation.value,
    createdBy: req.user._id,
  });

  let createdQuestions = [];
  if (deduped.uniqueQuestions.length > 0) {
    createdQuestions = await appendQuestionsToQuiz(
      createdQuiz._id,
      deduped.uniqueQuestions,
    );
  }
  const hydrated = await fetchQuizWithQuestions(createdQuiz._id);

  return res.status(201).json({
    success: true,
    message: "Quiz created from PDF import successfully.",
    data: hydrated,
    summary: {
      insertedQuestions: createdQuestions.length,
      skippedDuplicateQuestions: deduped.skippedDuplicateQuestions,
      mode: importMode,
    },
  });
});
