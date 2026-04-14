import asyncHandler from "express-async-handler";

import CodeDraft from "../models/codeDraft.js";
import Problem from "../models/ProblemModel.js";
import Submission from "../models/SubmissionModel.js";
import { applyAcceptedSolve } from "../services/solveTrackingService.js";
import {
  evaluateTestCase,
  normalizeJudgeStatus,
  runJudge0,
} from "../services/judge0Service.js";
import { isSupportedLanguage, SUPPORTED_LANGUAGES } from "../utils/languageMap.js";

const MAX_CODE_LENGTH =
  Number.parseInt(process.env.COMPILER_MAX_CODE_LENGTH || "", 10) || 200000;
const MAX_STDIN_LENGTH =
  Number.parseInt(process.env.COMPILER_MAX_STDIN_LENGTH || "", 10) || 50000;

const STATUS_LABELS = Object.freeze({
  accepted: "ACCEPTED",
  wrong_answer: "WRONG_ANSWER",
  compile_error: "COMPILATION_ERROR",
  runtime_error: "RUNTIME_ERROR",
  time_limit_exceeded: "TIME_LIMIT_EXCEEDED",
  internal_error: "INTERNAL_ERROR",
});

const normalizeLanguage = (value) => String(value || "").trim().toLowerCase();

const makeHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateLanguage = (languageValue) => {
  const language = normalizeLanguage(languageValue);

  if (!language || !isSupportedLanguage(language)) {
    throw makeHttpError(
      `Unsupported language. Allowed: ${SUPPORTED_LANGUAGES.join(", ")}`,
      400,
    );
  }

  return language;
};

const validateCode = (code) => {
  if (typeof code !== "string" || !code.trim()) {
    throw makeHttpError("code is required", 400);
  }

  if (code.length > MAX_CODE_LENGTH) {
    throw makeHttpError(
      `Code is too long. Maximum ${MAX_CODE_LENGTH.toLocaleString()} characters allowed`,
      400,
    );
  }

  return code;
};

const validateStdin = (stdin) => {
  if (stdin === undefined || stdin === null) return "";

  if (typeof stdin !== "string") {
    throw makeHttpError("stdin must be a string", 400);
  }

  if (stdin.length > MAX_STDIN_LENGTH) {
    throw makeHttpError(
      `stdin is too long. Maximum ${MAX_STDIN_LENGTH.toLocaleString()} characters allowed`,
      400,
    );
  }

  return stdin;
};

const toPublicStatus = (status) => STATUS_LABELS[status] || "INTERNAL_ERROR";

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

const getTestCaseExpectedOutput = (testCase = {}) =>
  testCase.output ?? testCase.expectedOutput ?? "";

const saveDraftForUser = async ({ userId, language, code }) => {
  if (!userId) return null;

  return CodeDraft.findOneAndUpdate(
    {
      userId,
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
};

const buildFailureCase = ({
  index,
  status,
  testCase,
  result,
  revealCaseDetails,
}) => {
  const safeStatus = toPublicStatus(status);

  if (!revealCaseDetails) {
    return {
      index,
      status: safeStatus,
      message: result?.message || "Failed on a hidden testcase",
    };
  }

  return {
    index,
    status: safeStatus,
    input: testCase?.input || "",
    expectedOutput: getTestCaseExpectedOutput(testCase),
    actualOutput: result?.actualOutput || "",
    stdout: result?.stdout || "",
    stderr: result?.stderr || "",
    compile_output: result?.compileOutput || "",
    message: result?.message || "",
  };
};

export const runCode = asyncHandler(async (req, res) => {
  const { language: languageInput, code: sourceCode, stdin: stdinInput } =
    req.body || {};

  const language = validateLanguage(languageInput);
  const code = validateCode(sourceCode);
  const stdin = validateStdin(stdinInput);

  const run = await runJudge0({
    language,
    sourceCode: code,
    stdin,
    cpuTimeLimit: 2,
    wallTimeLimit: 5,
  });

  if (req.user?._id) {
    await saveDraftForUser({
      userId: req.user._id,
      language,
      code,
    });
  }

  res.status(200).json({
    success: true,
    result: {
      ...run.normalized,
      executionMode: run.executionMode,
    },
  });
});

export const submitCode = asyncHandler(async (req, res) => {
  const {
    language: languageInput,
    code: sourceCode,
    stdin: stdinInput,
    problemSlug,
  } = req.body || {};

  const language = validateLanguage(languageInput);
  const code = validateCode(sourceCode);
  const stdin = validateStdin(stdinInput);

  if (req.user?._id) {
    await saveDraftForUser({
      userId: req.user._id,
      language,
      code,
    });
  }

  const normalizedSlug = String(problemSlug || "").trim();

  if (!normalizedSlug) {
    const run = await runJudge0({
      language,
      sourceCode: code,
      stdin,
      cpuTimeLimit: 2,
      wallTimeLimit: 5,
    });

    const internalStatus = normalizeJudgeStatus({
      statusId: run.statusId,
      hasCompileOutput: !!run.compileOutput,
      hasStderr: !!run.stderr,
    });

    const accepted = internalStatus === "accepted";

    res.status(200).json({
      success: true,
      submission: {
        status: toPublicStatus(internalStatus),
        passedCount: accepted ? 1 : 0,
        totalCount: 1,
        runtime: run.time,
        memory: run.memory,
        failedCase: accepted
          ? null
          : {
              index: 1,
              status: toPublicStatus(internalStatus),
              stdout: run.stdout || "",
              stderr: run.stderr || "",
              compile_output: run.compileOutput || "",
              message: run.message || "Execution failed",
            },
      },
      result: {
        ...run.normalized,
        executionMode: run.executionMode,
      },
    });

    return;
  }

  if (!req.user?._id) {
    throw makeHttpError("Login required to submit problem code", 401);
  }

  const problem = await Problem.findOne({
    slug: normalizedSlug,
    isActive: true,
  }).select("+hiddenTestCases");

  if (!problem) {
    throw makeHttpError("Problem not found", 404);
  }

  const allowedLanguages = Array.isArray(problem.supportedLanguages)
    ? problem.supportedLanguages
    : [];

  if (!allowedLanguages.includes(language)) {
    throw makeHttpError("Language not supported for this problem", 400);
  }

  const hiddenCases = Array.isArray(problem.hiddenTestCases)
    ? problem.hiddenTestCases
    : [];
  const visibleCases = Array.isArray(problem.visibleTestCases)
    ? problem.visibleTestCases
    : [];

  const useHiddenCases = hiddenCases.length > 0;
  const testCases = useHiddenCases ? hiddenCases : visibleCases;

  if (!testCases.length) {
    throw makeHttpError("No testcases configured for this problem", 400);
  }

  let passedCount = 0;
  let runtime = null;
  let memory = null;
  let internalStatus = "accepted";
  let failedCase = null;
  let judgeResponse = null;

  for (let index = 0; index < testCases.length; index += 1) {
    const currentTestCase = testCases[index];

    // eslint-disable-next-line no-await-in-loop
    const result = await evaluateTestCase({
      language,
      sourceCode: code,
      input: currentTestCase.input,
      expectedOutput: getTestCaseExpectedOutput(currentTestCase),
    });

    runtime = result.time ?? runtime;
    memory = result.memory ?? memory;
    judgeResponse = sanitizeJudgeResponse(result.judge);

    if (result.isAccepted) {
      passedCount += 1;
      continue;
    }

    internalStatus = result.status || "runtime_error";
    failedCase = buildFailureCase({
      index: index + 1,
      status: internalStatus,
      testCase: currentTestCase,
      result,
      revealCaseDetails: !useHiddenCases,
    });

    break;
  }

  const totalCount = testCases.length;
  const accepted = passedCount === totalCount;

  if (accepted) {
    internalStatus = "accepted";
    failedCase = null;
  }

  const submissionDoc = await Submission.create({
    user: req.user._id,
    problem: problem._id,
    language,
    code,
    status: internalStatus,
    isAccepted: accepted,
    runtime,
    memory,
    judgeResponse,
    failedTestCaseSummary: failedCase
      ? {
          failedAt: failedCase.index - 1,
          status: internalStatus,
        }
      : null,
  });

  const nextSubmissionsCount =
    Number(problem.submissionsCount ?? problem.submissionCount ?? 0) + 1;
  const nextSolvedCount =
    Number(problem.solvedCount ?? problem.acceptanceCount ?? 0) +
    (accepted ? 1 : 0);

  problem.submissionsCount = nextSubmissionsCount;
  problem.submissionCount = nextSubmissionsCount;
  problem.solvedCount = nextSolvedCount;
  problem.acceptanceCount = nextSolvedCount;
  problem.acceptanceRate =
    nextSubmissionsCount > 0
      ? Number(((nextSolvedCount / nextSubmissionsCount) * 100).toFixed(2))
      : 0;
  await problem.save({ validateBeforeSave: false });

  const streakUpdate = accepted
    ? await applyAcceptedSolve({
        userId: req.user._id,
        problemId: problem._id,
        difficulty: problem.difficulty,
      })
    : null;

  res.status(200).json({
    success: true,
    submission: {
      status: toPublicStatus(internalStatus),
      passedCount,
      totalCount,
      runtime,
      memory,
      failedCase,
      submissionId: submissionDoc._id,
      createdAt: submissionDoc.createdAt,
    },
    ...(streakUpdate ? { streak: streakUpdate } : {}),
  });
});

export const getDraft = asyncHandler(async (req, res) => {
  const language = validateLanguage(req.params.language);

  const draft = await CodeDraft.findOne({
    userId: req.user._id,
    language,
  }).lean();

  res.status(200).json({
    success: true,
    code: draft?.code || "",
    hasDraft: !!draft,
    draft: draft
      ? {
          _id: draft._id,
          language: draft.language,
          updatedAt: draft.updatedAt,
        }
      : null,
  });
});

export const saveDraft = asyncHandler(async (req, res) => {
  const { language: languageInput, code: sourceCode = "" } = req.body || {};

  const language = validateLanguage(languageInput);

  if (typeof sourceCode !== "string") {
    throw makeHttpError("code must be a string", 400);
  }

  if (sourceCode.length > MAX_CODE_LENGTH) {
    throw makeHttpError(
      `Code is too long. Maximum ${MAX_CODE_LENGTH.toLocaleString()} characters allowed`,
      400,
    );
  }

  const draft = await CodeDraft.findOneAndUpdate(
    {
      userId: req.user._id,
      language,
    },
    {
      $set: {
        code: sourceCode,
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
      updatedAt: draft.updatedAt,
      code: draft.code,
    },
  });
});
