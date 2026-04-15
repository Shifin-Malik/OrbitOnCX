import { normalizeJudgeStatus, runJudge0 } from "./judge0Service.js";

const NUMBER_EPSILON = 1e-9;

const STATUS_VERDICT_MAP = Object.freeze({
  accepted: "Accepted",
  wrong_answer: "Wrong Answer",
  runtime_error: "Runtime Error",
  compile_error: "Compilation Error",
  time_limit_exceeded: "Time Limit Exceeded",
  internal_error: "Internal Error",
});

const PRINT_HINT_BY_LANGUAGE = Object.freeze({
  javascript:
    "No printed output received. If your solution returns a value, print it with console.log(...).",
  python:
    "No printed output received. If your solution returns a value, print it with print(...).",
  java: "No printed output received. If your solution returns a value, print it with System.out.print(...).",
  cpp: "No printed output received. If your solution returns a value, print it with cout << ... .",
});

const PRINT_PATTERN_BY_LANGUAGE = Object.freeze({
  javascript: /console\.(log|info|error|warn)\s*\(/i,
  python: /\bprint\s*\(/i,
  java: /System\.out\.(print|println|printf)\s*\(/i,
  cpp: /\b(cout\s*<<|printf\s*\()/i,
});

const NUMERIC_TOKEN_REGEX = /^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?$/i;
const JAVASCRIPT_STDIN_PATTERN =
  /process\.stdin|readline\.createInterface|fs\.readFileSync\s*\(\s*0\b/i;
const JAVASCRIPT_FUNCTION_PATTERNS = [
  /function\s+([A-Za-z_$][\w$]*)\s*\(/,
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  /let\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  /var\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/,
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\s*\(/,
  /let\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\s*\(/,
  /var\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?function\s*\(/,
];

const toStringSafe = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidJavaScriptIdentifier = (value) =>
  /^[A-Za-z_$][\w$]*$/.test(String(value || ""));

const extractJavaScriptFunctionName = (userCode = "") => {
  const source = toStringSafe(userCode);

  for (const pattern of JAVASCRIPT_FUNCTION_PATTERNS) {
    const match = source.match(pattern);
    if (match?.[1] && isValidJavaScriptIdentifier(match[1])) {
      return match[1];
    }
  }

  return null;
};

const shouldUseJavaScriptWrapper = (userCode = "", functionName = null) => {
  const source = toStringSafe(userCode);
  if (!source.trim()) return false;
  if (JAVASCRIPT_STDIN_PATTERN.test(source)) return false;
  return Boolean(functionName || extractJavaScriptFunctionName(source));
};

export const wrapJavaScriptSolution = (
  userCode,
  input,
  functionName = "arrayLength",
) => {
  const normalizedCode = toStringSafe(userCode);
  const safeFunctionName = isValidJavaScriptIdentifier(functionName)
    ? functionName
    : "arrayLength";
  const safeInput = toStringSafe(input);

  return `
${normalizedCode}

(async function () {
  try {
    const __rawInput = ${JSON.stringify(safeInput)};
    var __parsedInput;

    try {
      __parsedInput = JSON.parse(__rawInput);
    } catch (parseErr) {
      __parsedInput = __rawInput;
    }

    var __solver =
      typeof ${safeFunctionName} === "function" ? ${safeFunctionName} : null;

    if (typeof __solver !== "function") {
      throw new Error("Function ${safeFunctionName} is not defined");
    }

    var __args = [];

    if (__rawInput.trim().length === 0 || __solver.length === 0) {
      __args = [];
    } else if (Array.isArray(__parsedInput) && __solver.length > 1) {
      __args = __parsedInput;
    } else if (
      __parsedInput &&
      typeof __parsedInput === "object" &&
      Array.isArray(__parsedInput.args)
    ) {
      __args = __parsedInput.args;
    } else {
      __args = [__parsedInput];
    }

    var __result = __solver.apply(null, __args);
    var __resolvedResult =
      __result && typeof __result.then === "function"
        ? await __result
        : __result;

    if (__resolvedResult !== undefined) {
      console.log(
        typeof __resolvedResult === "object"
          ? JSON.stringify(__resolvedResult)
          : String(__resolvedResult)
      );
    }
  } catch (err) {
    console.error(
      (err && err.stack) || (err && err.message) || String(err)
    );
    process.exit(1);
  }
})();
`;
};

const isNumericToken = (value) => NUMERIC_TOKEN_REGEX.test(String(value || ""));

const numbersAreEqual = (left, right) =>
  Math.abs(Number(left) - Number(right)) <= NUMBER_EPSILON;

const stripWrappingQuotes = (value) => {
  const source = toStringSafe(value).trim();
  if (source.length < 2) return source;

  const first = source[0];
  const last = source[source.length - 1];
  if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
    return source.slice(1, -1);
  }

  return source;
};

const looksLikeStructuredValue = (value) => {
  const source = toStringSafe(value).trim();
  if (!source) return false;
  const first = source[0];
  return (
    first === "{" ||
    first === "[" ||
    first === '"' ||
    first === "'" ||
    NUMERIC_TOKEN_REGEX.test(source) ||
    /^(true|false|null|none)$/i.test(source)
  );
};

const parseSingleQuotedJsonLike = (value) =>
  value.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner) => {
    const escaped = inner.replace(/"/g, '\\"');
    return `"${escaped}"`;
  });

const tryParseStructuredValue = (value) => {
  const source = toStringSafe(value).trim();
  if (!looksLikeStructuredValue(source)) return { parsed: false, value: null };

  const candidates = [
    source,
    source
      .replace(/\bTrue\b/g, "true")
      .replace(/\bFalse\b/g, "false")
      .replace(/\bNone\b/g, "null"),
    parseSingleQuotedJsonLike(
      source
        .replace(/\bTrue\b/g, "true")
        .replace(/\bFalse\b/g, "false")
        .replace(/\bNone\b/g, "null"),
    ),
  ];

  for (const candidate of candidates) {
    try {
      return { parsed: true, value: JSON.parse(candidate) };
    } catch {
      // continue to next candidate
    }
  }

  return { parsed: false, value: null };
};

const canonicalizeStructuredValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeStructuredValue(item));
  }

  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    const normalized = {};
    keys.forEach((key) => {
      normalized[key] = canonicalizeStructuredValue(value[key]);
    });
    return normalized;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  return value;
};

const deepStructuredEqual = (left, right) => {
  if (typeof left === "number" && typeof right === "number") {
    return numbersAreEqual(left, right);
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) return false;
    for (let index = 0; index < left.length; index += 1) {
      if (!deepStructuredEqual(left[index], right[index])) return false;
    }
    return true;
  }

  if (
    left &&
    right &&
    typeof left === "object" &&
    typeof right === "object" &&
    !Array.isArray(left) &&
    !Array.isArray(right)
  ) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) return false;
    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) return false;
      if (!deepStructuredEqual(left[key], right[key])) return false;
    }
    return true;
  }

  return left === right;
};

const tokenizeOutput = (value) =>
  normalizeOutputForComparison(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

const pickFirstNonEmptyOutput = (...values) => {
  for (const value of values) {
    const normalized = normalizeOutputForDisplay(value);
    if (normalized) return normalized;
  }
  return "";
};

const buildLikelyPrintHint = ({
  language,
  sourceCode,
  expectedOutput,
  actualOutput,
}) => {
  const expected = normalizeOutputForComparison(expectedOutput);
  const actual = normalizeOutputForComparison(actualOutput);

  if (!expected || actual) return "";

  const normalizedSource = toStringSafe(sourceCode);
  const hasReturn = /\breturn\b/.test(normalizedSource);
  if (!hasReturn) return "";

  const printPattern =
    PRINT_PATTERN_BY_LANGUAGE[language] || /console\.log|print|cout|System\.out/i;
  if (printPattern.test(normalizedSource)) return "";

  return (
    PRINT_HINT_BY_LANGUAGE[language] ||
    "No printed output received. Judge0 compares stdout, so print your final answer."
  );
};

export const normalizeOutput = (value = "") =>
  toStringSafe(value).replace(/\r/g, "").trim();

export const normalizeOutputForDisplay = (value) =>
  normalizeOutput(toStringSafe(value).replace(/\r\n/g, "\n"));

export const normalizeOutputForComparison = (value) => {
  const normalized = normalizeOutputForDisplay(value);
  if (!normalized) return "";

  return normalized
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

export const compareOutputs = (actualValue, expectedValue) => {
  const normalizedActual = normalizeOutputForComparison(actualValue);
  const normalizedExpected = normalizeOutputForComparison(expectedValue);

  if (normalizedActual === normalizedExpected) {
    return {
      isMatch: true,
      mode: "normalized_exact",
      normalizedActual,
      normalizedExpected,
    };
  }

  if (
    stripWrappingQuotes(normalizedActual) ===
    stripWrappingQuotes(normalizedExpected)
  ) {
    return {
      isMatch: true,
      mode: "quoted_string",
      normalizedActual,
      normalizedExpected,
    };
  }

  const actualStructured = tryParseStructuredValue(normalizedActual);
  const expectedStructured = tryParseStructuredValue(normalizedExpected);
  if (actualStructured.parsed && expectedStructured.parsed) {
    const left = canonicalizeStructuredValue(actualStructured.value);
    const right = canonicalizeStructuredValue(expectedStructured.value);
    if (deepStructuredEqual(left, right)) {
      return {
        isMatch: true,
        mode: "structured_json",
        normalizedActual,
        normalizedExpected,
      };
    }
  }

  const actualTokens = tokenizeOutput(normalizedActual);
  const expectedTokens = tokenizeOutput(normalizedExpected);
  if (actualTokens.length === expectedTokens.length && actualTokens.length > 0) {
    let tokensMatch = true;
    for (let index = 0; index < actualTokens.length; index += 1) {
      const actualToken = actualTokens[index];
      const expectedToken = expectedTokens[index];

      const sameToken = isNumericToken(actualToken) && isNumericToken(expectedToken)
        ? numbersAreEqual(actualToken, expectedToken)
        : actualToken === expectedToken;

      if (!sameToken) {
        tokensMatch = false;
        break;
      }
    }

    if (tokensMatch) {
      return {
        isMatch: true,
        mode: "tokenized_whitespace",
        normalizedActual,
        normalizedExpected,
      };
    }
  }

  return {
    isMatch: false,
    mode: "mismatch",
    normalizedActual,
    normalizedExpected,
  };
};

export const createVerdictFromStatus = (status) =>
  STATUS_VERDICT_MAP[status] || STATUS_VERDICT_MAP.internal_error;

export const getTestCaseExpectedOutput = (testCase = {}) =>
  testCase.output ?? testCase.expectedOutput ?? "";

export const sanitizeJudgeResponse = (judge) => {
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

export const resolveActualOutputForStatus = ({
  status,
  stdout,
  stderr,
  compileOutput,
  message,
}) => {
  if (status === "compile_error") {
    return pickFirstNonEmptyOutput(compileOutput, stderr, message, stdout);
  }

  if (
    status === "runtime_error" ||
    status === "time_limit_exceeded" ||
    status === "internal_error"
  ) {
    return pickFirstNonEmptyOutput(stderr, stdout, message, compileOutput);
  }

  return normalizeOutputForDisplay(stdout);
};

const prepareExecutionPayload = ({ language, sourceCode, input }) => {
  const normalizedLanguage = toStringSafe(language).trim().toLowerCase();
  const normalizedInput = toStringSafe(input);
  const normalizedCode = toStringSafe(sourceCode);

  if (normalizedLanguage !== "javascript") {
    return {
      sourceCode: normalizedCode,
      stdin: normalizedInput,
      executionMode: "stdin_script",
    };
  }

  const functionName = extractJavaScriptFunctionName(normalizedCode);
  const shouldWrap = shouldUseJavaScriptWrapper(normalizedCode, functionName);

  if (!shouldWrap) {
    return {
      sourceCode: normalizedCode,
      stdin: normalizedInput,
      executionMode: "stdin_script",
    };
  }

  return {
    sourceCode: wrapJavaScriptSolution(
      normalizedCode,
      normalizedInput,
      functionName || "arrayLength",
    ),
    stdin: "",
    executionMode: "function_wrapper",
  };
};

export const runSolutionWithJudge0 = async ({
  language,
  sourceCode,
  input = "",
  limits,
}) => {
  const prepared = prepareExecutionPayload({ language, sourceCode, input });

  const run = await runJudge0({
    language,
    sourceCode: prepared.sourceCode,
    stdin: prepared.stdin,
    cpuTimeLimit: limits?.cpuTimeLimit ?? 2,
    wallTimeLimit: limits?.wallTimeLimit ?? 5,
  });

  return {
    ...run,
    executionMode: prepared.executionMode,
  };
};

export const executeTestCase = async ({
  language,
  sourceCode,
  testCase = {},
  testcaseIndex = 0,
  source = "hidden_testcase",
  limits,
}) => {
  const expectedOutput = getTestCaseExpectedOutput(testCase);

  const run = await runSolutionWithJudge0({
    language,
    sourceCode,
    input: toStringSafe(testCase?.input),
    limits,
  });

  const baseStatus = normalizeJudgeStatus({
    statusId: run.statusId,
    hasCompileOutput: !!run.compileOutput,
    hasStderr: !!run.stderr,
  });

  const comparison =
    baseStatus === "accepted"
      ? compareOutputs(run.stdout, expectedOutput)
      : {
          isMatch: false,
          mode: "not_compared",
          normalizedActual: normalizeOutputForComparison(run.stdout),
          normalizedExpected: normalizeOutputForComparison(expectedOutput),
        };

  const finalStatus =
    baseStatus === "accepted" && !comparison.isMatch
      ? "wrong_answer"
      : baseStatus;

  const normalizedMessage = normalizeOutputForDisplay(run?.raw?.message);
  const wrongAnswerHint =
    finalStatus === "wrong_answer" && run.executionMode !== "function_wrapper"
      ? buildLikelyPrintHint({
          language,
          sourceCode,
          expectedOutput,
          actualOutput: run.stdout,
        })
      : "";

  const statusId = Number(run?.statusId ?? run?.raw?.status?.id ?? 0);
  const statusDescription = toStringSafe(
    run?.statusDescription || run?.raw?.status?.description || "Unknown",
  );

  return {
    testcaseIndex,
    source,
    status: finalStatus,
    verdict: createVerdictFromStatus(finalStatus),
    matched: finalStatus === "accepted",
    comparisonMode: comparison.mode,
    expectedOutput: normalizeOutputForDisplay(expectedOutput),
    actualOutput: resolveActualOutputForStatus({
      status: finalStatus,
      stdout: run.stdout,
      stderr: run.stderr,
      compileOutput: run.compileOutput,
      message: normalizedMessage,
    }),
    message: wrongAnswerHint || normalizedMessage,
    stdout: normalizeOutputForDisplay(run.stdout),
    stderr: normalizeOutputForDisplay(run.stderr),
    compileOutput: normalizeOutputForDisplay(run.compileOutput),
    time: toFiniteNumber(run.time),
    memory: toFiniteNumber(run.memory),
    statusId,
    statusDescription,
    executionMode: run.executionMode,
    judge: run.raw,
  };
};

export const executeTestCasesSequentially = async ({
  language,
  sourceCode,
  testCases,
  source = "hidden_testcase",
  limits,
  stopOnFirstFailure = true,
}) => {
  const safeCases = Array.isArray(testCases) ? testCases : [];

  let runtime = null;
  let memory = null;
  let judgeResponse = null;
  let passedCount = 0;
  let finalStatus = "accepted";
  let firstFailedTestcase = null;

  const testcaseResults = [];

  for (let index = 0; index < safeCases.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    const evaluated = await executeTestCase({
      language,
      sourceCode,
      testCase: safeCases[index],
      testcaseIndex: index,
      source,
      limits,
    });

    const nextRuntime = toFiniteNumber(evaluated.time);
    const nextMemory = toFiniteNumber(evaluated.memory);

    runtime = nextRuntime === null ? runtime : Math.max(runtime ?? 0, nextRuntime);
    memory = nextMemory === null ? memory : Math.max(memory ?? 0, nextMemory);
    judgeResponse = sanitizeJudgeResponse(evaluated.judge);

    testcaseResults.push({
      testcaseIndex: evaluated.testcaseIndex,
      expectedOutput: evaluated.expectedOutput,
      actualOutput: evaluated.actualOutput,
      verdict: evaluated.verdict,
      status: evaluated.status,
      source: evaluated.source,
      matched: evaluated.matched,
      message: evaluated.message,
    });

    if (evaluated.status === "accepted") {
      passedCount += 1;
      continue;
    }

    finalStatus = evaluated.status;
    if (!firstFailedTestcase) {
      firstFailedTestcase = {
        testcaseIndex: evaluated.testcaseIndex,
        expectedOutput: evaluated.expectedOutput,
        actualOutput: evaluated.actualOutput,
        verdict: evaluated.verdict,
        status: evaluated.status,
        source: evaluated.source,
        message: evaluated.message,
      };
    }

    if (stopOnFirstFailure) break;
  }

  const totalCount = safeCases.length;
  const isAccepted = finalStatus === "accepted" && passedCount === totalCount;

  return {
    status: isAccepted ? "accepted" : finalStatus,
    verdict: createVerdictFromStatus(isAccepted ? "accepted" : finalStatus),
    isAccepted,
    passedCount,
    totalCount,
    runtime,
    memory,
    judgeResponse,
    firstFailedTestcase,
    testcaseResults,
  };
};
