import axios from "axios";

const languageIds = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  php: 68,
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").trimEnd();
};

export const normalizeJudgeStatus = ({ statusId, hasCompileOutput, hasStderr }) => {
  if (statusId === 5) return "time_limit_exceeded";
  if (hasCompileOutput) return "compile_error";
  if (statusId && statusId !== 3 && hasStderr) return "runtime_error";
  if (statusId && statusId !== 3) return "runtime_error";
  return "accepted";
};

export const runJudge0 = async ({
  language,
  sourceCode,
  stdin = "",
  cpuTimeLimit = 2,
  wallTimeLimit = 5,
}) => {
  const languageId = languageIds[language];
  if (!languageId) {
    const err = new Error("Unsupported language");
    err.statusCode = 400;
    throw err;
  }

  const response = await axios.post(
    "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
    {
      language_id: languageId,
      source_code: sourceCode,
      stdin,
      cpu_time_limit: cpuTimeLimit,
      wall_time_limit: wallTimeLimit,
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    },
  );

  const result = response.data || {};
  const statusId = result?.status?.id;
  const stdout = normalizeText(result?.stdout);
  const stderr = normalizeText(result?.stderr);
  const compileOutput = normalizeText(result?.compile_output);

  return {
    raw: result,
    statusId,
    statusDescription: result?.status?.description || "Unknown",
    stdout,
    stderr,
    compileOutput,
    time: result?.time !== undefined && result?.time !== null ? Number(result.time) : null,
    memory:
      result?.memory !== undefined && result?.memory !== null ? Number(result.memory) : null,
  };
};

export const evaluateTestCase = async ({
  language,
  sourceCode,
  input,
  expectedOutput,
  limits,
}) => {
  const run = await runJudge0({
    language,
    sourceCode,
    stdin: input || "",
    cpuTimeLimit: limits?.cpuTimeLimit ?? 2,
    wallTimeLimit: limits?.wallTimeLimit ?? 5,
  });

  const baseStatus = normalizeJudgeStatus({
    statusId: run.statusId,
    hasCompileOutput: !!run.compileOutput,
    hasStderr: !!run.stderr,
  });

  const actual = normalizeText(run.stdout || run.stderr || run.compileOutput);
  const expected = normalizeText(expectedOutput);

  if (baseStatus !== "accepted") {
    return {
      status: baseStatus,
      isAccepted: false,
      actualOutput: actual,
      expectedOutput: expected,
      stdout: run.stdout,
      stderr: run.stderr,
      compileOutput: run.compileOutput,
      time: run.time,
      memory: run.memory,
      judge: run.raw,
    };
  }

  const pass = normalizeText(actual) === normalizeText(expected);
  return {
    status: pass ? "accepted" : "wrong_answer",
    isAccepted: pass,
    actualOutput: actual,
    expectedOutput: expected,
    stdout: run.stdout,
    stderr: run.stderr,
    compileOutput: run.compileOutput,
    time: run.time,
    memory: run.memory,
    judge: run.raw,
  };
};

