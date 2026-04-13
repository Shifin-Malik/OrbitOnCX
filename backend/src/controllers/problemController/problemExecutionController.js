import asyncHandler from "express-async-handler";
import Problem from "../../models/ProblemModel.js";
import Submission from "../../models/SubmissionModel.js";
import { evaluateTestCase } from "../../services/judge0Service.js";
import { applyAcceptedSolve } from "../../services/solveTrackingService.js";

const MAX_CODE_LENGTH = 200000;

const sanitizeJudgeResponse = (judge) => {
  if (!judge || typeof judge !== "object") return null;
  const {
    stdout,
    stderr,
    compile_output,
    message,
    status,
    time,
    memory,
    exit_code,
    exit_signal,
  } = judge;
  return {
    stdout,
    stderr,
    compile_output,
    message,
    status,
    time,
    memory,
    exit_code,
    exit_signal,
  };
};

const isSupportedLanguage = (problem, language) => {
  const supported = problem?.supportedLanguages || [];
  return supported.includes(language);
};

const getTestCaseExpectedOutput = (testCase = {}) =>
  testCase.output ?? testCase.expectedOutput ?? "";

export const runProblem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language, code } = req.body || {};

  if (!language || typeof language !== "string") {
    res.status(400);
    throw new Error("language is required");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    res.status(400);
    throw new Error("code is required");
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
  if (!isSupportedLanguage(problem, language)) {
    res.status(400);
    throw new Error("Language not supported for this problem");
  }

  const visible = Array.isArray(problem.visibleTestCases)
    ? problem.visibleTestCases
    : [];

  if (!visible.length) {
    res.status(400);
    throw new Error("No visible testcases configured for this problem");
  }

  const caseResults = [];
  let overallStatus = "accepted";
  let accepted = true;

  for (let i = 0; i < visible.length; i++) {
    const t = visible[i];
    const expectedOutput = getTestCaseExpectedOutput(t);
    // eslint-disable-next-line no-await-in-loop
    const r = await evaluateTestCase({
      language,
      sourceCode: code,
      input: t.input,
      expectedOutput,
    });

    caseResults.push({
      index: i,
      status: r.status,
      isAccepted: r.isAccepted,
      input: t.input,
      expectedOutput,
      actualOutput: r.actualOutput,
      stdout: r.stdout,
      stderr: r.stderr,
      compileOutput: r.compileOutput,
      time: r.time,
      memory: r.memory,
    });

    if (!r.isAccepted) {
      accepted = false;
      overallStatus = r.status;
      break;
    }
  }

  res.status(200).json({
    success: true,
    status: overallStatus,
    isAccepted: accepted,
    results: caseResults,
  });
});

export const submitProblem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { language, code } = req.body || {};

  if (!language || typeof language !== "string") {
    res.status(400);
    throw new Error("language is required");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    res.status(400);
    throw new Error("code is required");
  }
  if (code.length > MAX_CODE_LENGTH) {
    res.status(400);
    throw new Error("code is too long");
  }

  const problem = await Problem.findOne({ slug, isActive: true }).select("+hiddenTestCases");
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }
  if (!isSupportedLanguage(problem, language)) {
    res.status(400);
    throw new Error("Language not supported for this problem");
  }

  const hidden = Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases : [];
  if (!hidden.length) {
    res.status(400);
    throw new Error("No hidden testcases configured for this problem");
  }

  let firstFail = null;
  let finalStatus = "accepted";
  let isAccepted = true;
  let runtime = null;
  let memory = null;
  let judgeResponse = null;

  for (let i = 0; i < hidden.length; i++) {
    const t = hidden[i];
    const expectedOutput = getTestCaseExpectedOutput(t);
    // eslint-disable-next-line no-await-in-loop
    const r = await evaluateTestCase({
      language,
      sourceCode: code,
      input: t.input,
      expectedOutput,
    });

    runtime = r.time ?? runtime;
    memory = r.memory ?? memory;
    judgeResponse = sanitizeJudgeResponse(r.judge);

    if (!r.isAccepted) {
      isAccepted = false;
      finalStatus = r.status;
      firstFail = { failedAt: i, status: r.status };
      break;
    }
  }

  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language,
    code,
    status: finalStatus,
    isAccepted,
    runtime,
    memory,
    judgeResponse,
    failedTestCaseSummary: firstFail,
  });

  const nextSubmissionsCount =
    Number(problem.submissionsCount ?? problem.submissionCount ?? 0) + 1;
  const nextSolvedCount =
    Number(problem.solvedCount ?? problem.acceptanceCount ?? 0) + (isAccepted ? 1 : 0);

  problem.submissionsCount = nextSubmissionsCount;
  problem.submissionCount = nextSubmissionsCount;
  problem.solvedCount = nextSolvedCount;
  problem.acceptanceCount = nextSolvedCount;
  problem.acceptanceRate =
    nextSubmissionsCount > 0
      ? Number(((nextSolvedCount / nextSubmissionsCount) * 100).toFixed(2))
      : 0;
  await problem.save({ validateBeforeSave: false });

  let streakUpdate = null;
  if (isAccepted) {
    streakUpdate = await applyAcceptedSolve({
      userId: req.user._id,
      problemId: problem._id,
      difficulty: problem.difficulty,
    });
  }

  res.status(200).json({
    success: true,
    status: finalStatus,
    isAccepted,
    submission: {
      _id: submission._id,
      createdAt: submission.createdAt,
      language: submission.language,
      status: submission.status,
      isAccepted: submission.isAccepted,
      runtime: submission.runtime,
      memory: submission.memory,
      failedTestCaseSummary: submission.failedTestCaseSummary,
    },
    streak: streakUpdate,
  });
});

