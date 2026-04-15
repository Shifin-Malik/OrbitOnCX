import asyncHandler from "express-async-handler";

import Problem from "../../models/ProblemModel.js";
import Submission from "../../models/SubmissionModel.js";
import {
  createVerdictFromStatus,
  executeTestCase,
  executeTestCasesSequentially,
  normalizeOutputForDisplay,
  resolveActualOutputForStatus,
  runSolutionWithJudge0,
} from "../../services/problemJudgingService.js";
import { normalizeJudgeStatus } from "../../services/judge0Service.js";
import { applyAcceptedSolve } from "../../services/solveTrackingService.js";

const MAX_CODE_LENGTH = 200000;
const MAX_STDIN_LENGTH = 50000;

const normalizeLanguage = (value) => String(value || "").trim().toLowerCase();

const isSupportedLanguage = (problem, language) => {
  const supported = Array.isArray(problem?.supportedLanguages)
    ? problem.supportedLanguages
    : [];
  return supported.map((item) => normalizeLanguage(item)).includes(language);
};

const validateRunBody = ({ language, code, stdin, testcaseIndex }, res) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (!normalizedLanguage) {
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

  if (stdin !== undefined && typeof stdin !== "string") {
    res.status(400);
    throw new Error("stdin must be a string");
  }

  if (typeof stdin === "string" && stdin.length > MAX_STDIN_LENGTH) {
    res.status(400);
    throw new Error("stdin is too long");
  }

  let selectedTestcaseIndex = null;
  if (testcaseIndex !== undefined && testcaseIndex !== null) {
    const parsed = Number(testcaseIndex);
    if (!Number.isInteger(parsed) || parsed < 0) {
      res.status(400);
      throw new Error("Invalid testcase index");
    }
    selectedTestcaseIndex = parsed;
  }

  return {
    language: normalizedLanguage,
    code,
    stdin,
    testcaseIndex: selectedTestcaseIndex,
  };
};

const validateSubmitBody = ({ language, code }, res) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (!normalizedLanguage) {
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

  return {
    language: normalizedLanguage,
    code,
  };
};

const buildRunResultPayload = ({
  statusId,
  statusDescription,
  stdout,
  stderr,
  compileOutput,
  message,
  time,
  memory,
}) => ({
  status: {
    id: Number(statusId || 0),
    description: statusDescription || "Unknown",
  },
  stdout: normalizeOutputForDisplay(stdout),
  stderr: normalizeOutputForDisplay(stderr),
  compile_output: normalizeOutputForDisplay(compileOutput),
  message: normalizeOutputForDisplay(message),
  time: time !== undefined && time !== null ? String(time) : "",
  memory: memory ?? null,
});

const buildTestcaseMeta = (details = {}) => ({
  testcaseIndex:
    Number.isInteger(details.testcaseIndex) && details.testcaseIndex >= 0
      ? details.testcaseIndex
      : null,
  expectedOutput: normalizeOutputForDisplay(details.expectedOutput),
  actualOutput: normalizeOutputForDisplay(details.actualOutput),
  verdict: createVerdictFromStatus(details.status),
  status: details.status || "internal_error",
  source: details.source || "hidden_testcase",
  matched:
    typeof details.matched === "boolean"
      ? details.matched
      : details.status === "accepted",
  message: normalizeOutputForDisplay(details.message),
});

export const runProblem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const payload = validateRunBody(req.body || {}, res);

  const problem = await Problem.findOne({ slug, isActive: true }).lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  if (!isSupportedLanguage(problem, payload.language)) {
    res.status(400);
    throw new Error("Language not supported for this problem");
  }

  const visibleTestCases = Array.isArray(problem.visibleTestCases)
    ? problem.visibleTestCases
    : [];

  if (
    payload.testcaseIndex !== null &&
    !visibleTestCases[payload.testcaseIndex]
  ) {
    res.status(400);
    throw new Error("Selected testcase is not available");
  }

  const selectedVisibleCase =
    payload.testcaseIndex !== null
      ? visibleTestCases[payload.testcaseIndex]
      : visibleTestCases.length
        ? visibleTestCases[0]
        : null;

  const hasCustomInput =
    Object.prototype.hasOwnProperty.call(req.body || {}, "stdin") &&
    typeof payload.stdin === "string";

  if (!hasCustomInput && !selectedVisibleCase) {
    res.status(400);
    throw new Error("No visible testcases configured for this problem");
  }

  if (!hasCustomInput && selectedVisibleCase) {
    const testcaseIndex =
      payload.testcaseIndex !== null ? payload.testcaseIndex : 0;

    const evaluated = await executeTestCase({
      language: payload.language,
      sourceCode: payload.code,
      testCase: selectedVisibleCase,
      testcaseIndex,
      source: "visible_testcase",
    });

    const testcaseDetails = buildTestcaseMeta({
      testcaseIndex,
      expectedOutput: evaluated.expectedOutput,
      actualOutput: evaluated.actualOutput,
      status: evaluated.status,
      source: "visible_testcase",
      matched: evaluated.matched,
      message: evaluated.message,
    });

    return res.status(200).json({
      success: true,
      result: buildRunResultPayload({
        statusId: evaluated.statusId,
        statusDescription: evaluated.statusDescription,
        stdout: evaluated.stdout,
        stderr: evaluated.stderr,
        compileOutput: evaluated.compileOutput,
        message: evaluated.message,
        time: evaluated.time,
        memory: evaluated.memory,
      }),
      testcaseResults: [testcaseDetails],
      run: {
        source: "visible_testcase",
        testcaseIndex,
        status: evaluated.status,
        verdict: evaluated.verdict,
        expectedOutput: evaluated.expectedOutput,
        actualOutput: evaluated.actualOutput,
        matchedExpected: evaluated.matched,
        testcase: testcaseDetails,
      },
    });
  }

  const run = await runSolutionWithJudge0({
    language: payload.language,
    sourceCode: payload.code,
    input: payload.stdin || "",
  });

  const status = normalizeJudgeStatus({
    statusId: run.statusId,
    hasCompileOutput: !!run.compileOutput,
    hasStderr: !!run.stderr,
  });

  const testcaseDetails = buildTestcaseMeta({
    testcaseIndex: null,
    expectedOutput: "",
    actualOutput: resolveActualOutputForStatus({
      status,
      stdout: run.stdout,
      stderr: run.stderr,
      compileOutput: run.compileOutput,
      message: run?.raw?.message || run?.message,
    }),
    status,
    source: "custom_input",
    matched: null,
    message: run?.raw?.message || run?.message || "",
  });

  return res.status(200).json({
    success: true,
    result: buildRunResultPayload({
      statusId: run.statusId,
      statusDescription: run.statusDescription,
      stdout: run.stdout,
      stderr: run.stderr,
      compileOutput: run.compileOutput,
      message: run?.raw?.message || run?.message,
      time: run.time,
      memory: run.memory,
    }),
    testcaseResults: [testcaseDetails],
    run: {
      source: "custom_input",
      testcaseIndex: null,
      status,
      verdict: createVerdictFromStatus(status),
      expectedOutput: "",
      actualOutput: testcaseDetails.actualOutput,
      matchedExpected: null,
      testcase: testcaseDetails,
    },
  });
});

export const submitProblem = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    res.status(401);
    throw new Error("Login required to submit problem code");
  }

  const { slug } = req.params;
  const payload = validateSubmitBody(req.body || {}, res);

  const problem = await Problem.findOne({ slug, isActive: true }).select(
    "+hiddenTestCases",
  );

  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  if (!isSupportedLanguage(problem, payload.language)) {
    res.status(400);
    throw new Error("Language not supported for this problem");
  }

  const hiddenTestCases = Array.isArray(problem.hiddenTestCases)
    ? problem.hiddenTestCases
    : [];

  if (!hiddenTestCases.length) {
    res.status(400);
    throw new Error("No hidden testcases configured for this problem");
  }

  const execution = await executeTestCasesSequentially({
    language: payload.language,
    sourceCode: payload.code,
    testCases: hiddenTestCases,
    source: "hidden_testcase",
    stopOnFirstFailure: true,
  });

  const finalStatus = execution.status;
  const isAccepted = execution.isAccepted;

  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language: payload.language,
    code: payload.code,
    status: finalStatus,
    isAccepted,
    runtime: execution.runtime,
    memory: execution.memory,
    judgeResponse: execution.judgeResponse,
    failedTestCaseSummary: execution.firstFailedTestcase
      ? {
          failedAt: execution.firstFailedTestcase.testcaseIndex,
          status: finalStatus,
        }
      : null,
  });

  const nextSubmissionsCount =
    Number(problem.submissionsCount ?? problem.submissionCount ?? 0) + 1;
  const nextSolvedCount =
    Number(problem.solvedCount ?? problem.acceptanceCount ?? 0) +
    (isAccepted ? 1 : 0);

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

  const firstFailed = execution.firstFailedTestcase
    ? {
        index: execution.firstFailedTestcase.testcaseIndex + 1,
        testcaseIndex: execution.firstFailedTestcase.testcaseIndex,
        expectedOutput: execution.firstFailedTestcase.expectedOutput,
        actualOutput: execution.firstFailedTestcase.actualOutput,
        verdict: execution.firstFailedTestcase.verdict,
        status: execution.firstFailedTestcase.status,
        source: execution.firstFailedTestcase.source,
        message: execution.firstFailedTestcase.message,
      }
    : null;

  res.status(200).json({
    success: true,
    status: finalStatus,
    verdict: createVerdictFromStatus(finalStatus),
    isAccepted,
    testcaseResults: execution.testcaseResults,
    firstFailedTestcase: firstFailed,
    submission: {
      _id: submission._id,
      createdAt: submission.createdAt,
      language: submission.language,
      status: submission.status,
      isAccepted: submission.isAccepted,
      verdict: createVerdictFromStatus(finalStatus),
      passedCount: execution.passedCount,
      totalCount: execution.totalCount,
      runtime:
        execution.runtime !== undefined && execution.runtime !== null
          ? String(execution.runtime)
          : "",
      memory: execution.memory,
      failedCase: firstFailed,
      testcaseResults: execution.testcaseResults,
      failedTestCaseSummary: submission.failedTestCaseSummary,
      usedHiddenTestCases: true,
    },
    streak: streakUpdate,
  });
});
