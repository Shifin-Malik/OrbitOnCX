import asyncHandler from "express-async-handler";

import Problem from "../../models/ProblemModel.js";
import Submission from "../../models/SubmissionModel.js";
import {
  evaluateTestCase,
  normalizeJudgeStatus,
  runJudge0,
} from "../../services/judge0Service.js";
import { applyAcceptedSolve } from "../../services/solveTrackingService.js";

const MAX_CODE_LENGTH = 200000;
const MAX_STDIN_LENGTH = 50000;

const STATUS_VERDICT_MAP = {
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compile_error: "Compile Error",
  time_limit_exceeded: "Time Limit Exceeded",
  internal_error: "Internal Error",
};

const toVerdict = (status) => STATUS_VERDICT_MAP[status] || "Runtime Error";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").trimEnd();
};

const normalizeLanguage = (value) => String(value || "").trim().toLowerCase();
const toFiniteNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

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
  const supported = Array.isArray(problem?.supportedLanguages)
    ? problem.supportedLanguages
    : [];
  return supported.map((item) => normalizeLanguage(item)).includes(language);
};

const getTestCaseExpectedOutput = (testCase = {}) =>
  testCase.output ?? testCase.expectedOutput ?? "";

const normalizeRunResult = (run) => {
  const statusId = Number(run?.raw?.status?.id ?? run?.statusId ?? 0);

  return {
    status: {
      id: statusId,
      description:
        run?.raw?.status?.description || run?.statusDescription || "Unknown",
    },
    stdout: normalizeText(run?.stdout),
    stderr: normalizeText(run?.stderr),
    compile_output: normalizeText(
      run?.compileOutput ?? run?.raw?.compile_output,
    ),
    message: normalizeText(run?.raw?.message || run?.message),
    time:
      run?.time !== undefined && run?.time !== null ? String(run.time) : "",
    memory: run?.memory ?? null,
  };
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

  const resolvedInput = hasCustomInput
    ? payload.stdin
    : selectedVisibleCase?.input || "";
  const runSource = hasCustomInput ? "custom_input" : "visible_testcase";

  const run = await runJudge0({
    language: payload.language,
    sourceCode: payload.code,
    stdin: resolvedInput,
  });

  const result = normalizeRunResult(run);

  const baseStatus = normalizeJudgeStatus({
    statusId: result.status.id,
    hasCompileOutput: !!result.compile_output,
    hasStderr: !!result.stderr,
  });

  const expectedOutput = runSource === "visible_testcase" && selectedVisibleCase
    ? getTestCaseExpectedOutput(selectedVisibleCase)
    : null;

  const actualOutput = normalizeText(result.stdout);

  const outputMatchesVisibleCase =
    runSource === "visible_testcase" && selectedVisibleCase && baseStatus === "accepted"
      ? normalizeText(expectedOutput) === actualOutput
      : null;

  const runStatus =
    outputMatchesVisibleCase === false ? "wrong_answer" : baseStatus;

  res.status(200).json({
    success: true,
    result,
    run: {
      source: runSource,
      testcaseIndex:
        runSource === "visible_testcase"
          ? selectedVisibleCase && payload.testcaseIndex !== null
            ? payload.testcaseIndex
            : selectedVisibleCase
              ? 0
              : null
          : null,
      status: runStatus,
      verdict: toVerdict(runStatus),
      expectedOutput,
      actualOutput,
      matchedExpected: outputMatchesVisibleCase,
    },
  });
});

export const submitProblem = asyncHandler(async (req, res) => {
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
  const visibleTestCases = Array.isArray(problem.visibleTestCases)
    ? problem.visibleTestCases
    : [];

  const useHiddenTestCases = hiddenTestCases.length > 0;
  const testCases = useHiddenTestCases ? hiddenTestCases : visibleTestCases;

  if (!testCases.length) {
    res.status(400);
    throw new Error("No testcases configured for this problem");
  }

  let finalStatus = "accepted";
  let isAccepted = true;
  let runtime = null;
  let memory = null;
  let judgeResponse = null;
  let failedCase = null;
  let passedCount = 0;

  for (let index = 0; index < testCases.length; index += 1) {
    const testCase = testCases[index];
    const expectedOutput = getTestCaseExpectedOutput(testCase);

    // eslint-disable-next-line no-await-in-loop
    const result = await evaluateTestCase({
      language: payload.language,
      sourceCode: payload.code,
      input: testCase.input,
      expectedOutput,
    });

    const nextRuntime = toFiniteNumber(result.time);
    const nextMemory = toFiniteNumber(result.memory);
    runtime = nextRuntime === null ? runtime : Math.max(runtime ?? 0, nextRuntime);
    memory = nextMemory === null ? memory : Math.max(memory ?? 0, nextMemory);
    judgeResponse = sanitizeJudgeResponse(result.judge);

    if (result.isAccepted) {
      passedCount += 1;
      continue;
    }

    finalStatus = result.status;
    isAccepted = false;

    failedCase = {
      index: index + 1,
      input: useHiddenTestCases ? "" : testCase.input || "",
      expectedOutput: useHiddenTestCases ? "" : expectedOutput || "",
      actualOutput: useHiddenTestCases ? "" : result.actualOutput || "",
      message: useHiddenTestCases
        ? "Failed on hidden testcase"
        : result.message || "Execution failed",
      status: result.status,
      verdict: toVerdict(result.status),
    };

    break;
  }

  const totalCount = testCases.length;

  const submission = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language: payload.language,
    code: payload.code,
    status: finalStatus,
    isAccepted,
    runtime,
    memory,
    judgeResponse,
    failedTestCaseSummary: failedCase
      ? { failedAt: failedCase.index - 1, status: finalStatus }
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
      verdict: toVerdict(finalStatus),
      passedCount,
      totalCount,
      runtime:
        runtime !== undefined && runtime !== null ? String(runtime) : "",
      memory,
      failedCase,
      failedTestCaseSummary: submission.failedTestCaseSummary,
      usedHiddenTestCases: useHiddenTestCases,
    },
    streak: streakUpdate,
  });
});
