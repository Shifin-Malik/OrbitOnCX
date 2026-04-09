import asyncHandler from "express-async-handler";
import Problem from "../../models/ProblemModel.js";
import ProblemCodeDraft from "../../models/ProblemCodeDraftModel.js";

const MAX_CODE_LENGTH = 200000;

const getStarterCodeFor = (problem, language) => {
  const sc = problem?.starterCode;
  if (!sc) return "";
  if (typeof sc.get === "function") return sc.get(language) || "";
  return sc?.[language] || "";
};

export const getProblemDraft = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language } = req.query;

  if (!language || typeof language !== "string") {
    res.status(400);
    throw new Error("language is required");
  }

  const problem = await Problem.findOne({ slug, isActive: true }).lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  const draft = await ProblemCodeDraft.findOne({
    user: req.user._id,
    problem: problem._id,
    language,
  }).lean();

  res.status(200).json({
    success: true,
    code: draft?.code || "",
    hasDraft: !!draft,
    starterCode: getStarterCodeFor(problem, language),
    updatedAt: draft?.updatedAt || null,
  });
});

export const upsertProblemDraft = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language, code = "" } = req.body || {};

  if (!language || typeof language !== "string") {
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

  const draft = await ProblemCodeDraft.findOneAndUpdate(
    { user: req.user._id, problem: problem._id, language },
    { $set: { code } },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();

  res.status(200).json({
    success: true,
    draft: {
      _id: draft._id,
      language: draft.language,
      updatedAt: draft.updatedAt,
    },
  });
});

