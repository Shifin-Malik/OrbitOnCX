import asyncHandler from "express-async-handler";

import Problem from "../../models/ProblemModel.js";
import ProblemCodeDraft from "../../models/ProblemCodeDraftModel.js";

const MAX_CODE_LENGTH = 200000;

const normalizeLanguage = (value) => String(value || "").trim().toLowerCase();

const getStarterCodeFor = (problem, language) => {
  const starterCode = problem?.starterCode;
  if (!starterCode) return "";
  if (typeof starterCode.get === "function") return starterCode.get(language) || "";
  return starterCode?.[language] || "";
};

const assertLanguageSupported = (problem, language) => {
  const supported = Array.isArray(problem?.supportedLanguages)
    ? problem.supportedLanguages
    : [];

  const normalizedSupported = supported.map((item) =>
    String(item || "").trim().toLowerCase(),
  );

  if (!normalizedSupported.includes(language)) {
    const error = new Error("Language not supported for this problem");
    error.statusCode = 400;
    throw error;
  }
};

export const getProblemDraft = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const language = normalizeLanguage(req.query.language);

  if (!language) {
    res.status(400);
    throw new Error("language is required");
  }

  const problem = await Problem.findOne({ slug, isActive: true }).lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  assertLanguageSupported(problem, language);

  const draft = await ProblemCodeDraft.findOne({
    user: req.user._id,
    problem: problem._id,
    language,
  }).lean();

  res.status(200).json({
    success: true,
    language,
    code: draft?.code || "",
    hasDraft: !!draft,
    starterCode: getStarterCodeFor(problem, language),
    updatedAt: draft?.updatedAt || null,
  });
});

export const upsertProblemDraft = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const language = normalizeLanguage(req.body?.language);
  const code = req.body?.code ?? "";

  if (!language) {
    res.status(400);
    throw new Error("language is required");
  }

  if (typeof code !== "string") {
    res.status(400);
    throw new Error("code must be a string");
  }

  if (code.length > MAX_CODE_LENGTH) {
    res.status(400);
    throw new Error("code is too long");
  }

  const problem = await Problem.findOne({ slug, isActive: true }).lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  assertLanguageSupported(problem, language);

  const draft = await ProblemCodeDraft.findOneAndUpdate(
    {
      user: req.user._id,
      problem: problem._id,
      language,
    },
    {
      $set: {
        code,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  ).lean();

  res.status(200).json({
    success: true,
    draft: {
      _id: draft._id,
      language: draft.language,
      code: draft.code,
      updatedAt: draft.updatedAt,
    },
  });
});
