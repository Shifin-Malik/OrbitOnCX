import React from "react";

const EMPTY_TEXT = "No output";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r\n/g, "\n").trim();
};

const prettifyStatus = (value) => {
  const source = normalizeText(value);
  if (!source) return "Unknown";
  if (source.includes(" ")) return source;
  return source
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const prettifySource = (value) =>
  normalizeText(value).replace(/_/g, " ").trim();

const getStatusTone = (value) => {
  const status = normalizeText(value).toLowerCase();
  if (status.includes("accept")) {
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }
  if (status.includes("wrong")) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }
  if (status.includes("time limit")) {
    return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  }
  if (status.includes("runtime")) {
    return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  }
  if (status.includes("compile")) {
    return "bg-pink-500/15 text-pink-300 border-pink-500/30";
  }
  if (status.includes("error") || status.includes("internal")) {
    return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  }
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
};

const normalizeTestcaseResult = (item, fallbackSource = "") => {
  if (!item || typeof item !== "object") return null;

  const testcaseIndex =
    Number.isInteger(item?.testcaseIndex) && item.testcaseIndex >= 0
      ? item.testcaseIndex
      : Number.isInteger(item?.index) && item.index > 0
        ? item.index - 1
        : null;

  const status = prettifyStatus(
    item?.verdict || item?.status || item?.result || "Unknown",
  );

  return {
    testcaseIndex,
    status,
    source: prettifySource(item?.source || fallbackSource),
    expectedOutput: normalizeText(item?.expectedOutput),
    actualOutput: normalizeText(item?.actualOutput),
    message: normalizeText(item?.message),
  };
};

const readTestcaseResults = (rawResults, fallbackSource = "") => {
  if (!Array.isArray(rawResults)) return [];
  return rawResults
    .map((item) => normalizeTestcaseResult(item, fallbackSource))
    .filter(Boolean);
};

const readRunPayload = (runOutput) => {
  if (!runOutput) return null;

  

  const result = runOutput?.result || {};
  const runMeta = runOutput?.run || {};
  const legacyResults = Array.isArray(runOutput?.results)
    ? runOutput.results
    : [];
  const firstLegacy = legacyResults[0] || null;
  const firstFailedLegacy =
    legacyResults.find((item) => item?.isAccepted === false) || null;
  const selectedLegacy = firstFailedLegacy || firstLegacy;

  const statusText = prettifyStatus(
    runMeta?.verdict ||
      runMeta?.status ||
      runOutput?.verdict ||
      runOutput?.status ||
      (runOutput?.isAccepted ? "Accepted" : "") ||
      selectedLegacy?.status ||
      result?.status?.description ||
      "",
  );

  const rawExecutionStatus = normalizeText(result?.status?.description);
  const executionStatus = rawExecutionStatus
    ? prettifyStatus(rawExecutionStatus)
    : "";
  const stdout = normalizeText(result?.stdout ?? selectedLegacy?.actualOutput);
  const stderr = normalizeText(result?.stderr);
  const compileOutput = normalizeText(
    result?.compile_output ?? result?.compileOutput,
  );
  const message = normalizeText(result?.message);

  const runActualOutput =
    runMeta?.actualOutput ?? selectedLegacy?.actualOutput ?? null;
  const actualOutput =
    runActualOutput !== null && runActualOutput !== undefined
      ? normalizeText(runActualOutput)
      : normalizeText(stdout || stderr || compileOutput || message);

  const testcaseResultsFromApi = readTestcaseResults(
    runOutput?.testcaseResults || runMeta?.testcaseResults,
    runMeta?.source || "visible_testcase",
  );
  const singleRunTestcase = normalizeTestcaseResult(
    runMeta?.testcase || null,
    runMeta?.source || "visible_testcase",
  );
  const fallbackRunTestcase =
    runMeta?.source || runMeta?.expectedOutput || runMeta?.actualOutput
      ? normalizeTestcaseResult(
          {
            testcaseIndex: runMeta?.testcaseIndex,
            expectedOutput: runMeta?.expectedOutput,
            actualOutput: runMeta?.actualOutput ?? actualOutput,
            status: runMeta?.verdict || runMeta?.status || statusText,
            source: runMeta?.source || "visible_testcase",
            message: runMeta?.message,
          },
          "visible_testcase",
        )
      : null;

  const testcaseResults = testcaseResultsFromApi.length
    ? testcaseResultsFromApi
    : singleRunTestcase
      ? [singleRunTestcase]
      : fallbackRunTestcase
        ? [fallbackRunTestcase]
        : [];

  return {
    status: statusText,
    statusId: Number(result?.status?.id ?? 0) || 0,
    executionStatus,
    stdout,
    stderr,
    compileOutput,
    message,
    time: normalizeText(result?.time),
    memory: result?.memory ?? null,
    source: normalizeText(runMeta?.source),
    testcaseIndex:
      Number.isInteger(runMeta?.testcaseIndex) && runMeta.testcaseIndex >= 0
        ? runMeta.testcaseIndex
        : null,
    expectedOutput: normalizeText(
      runMeta?.expectedOutput ?? selectedLegacy?.expectedOutput,
    ),
    actualOutput,
    matchedExpected:
      typeof runMeta?.matchedExpected === "boolean"
        ? runMeta.matchedExpected
        : null,
    testcaseResults,
  };
};

const readSubmitPayload = (submitOutput) => {
  if (!submitOutput) return null;
  const submission = submitOutput?.submission || {};

  const status = prettifyStatus(
    submission?.verdict ||
      submitOutput?.verdict ||
      submitOutput?.status ||
      (submitOutput?.isAccepted ? "Accepted" : ""),
  );

  const testcaseResults = readTestcaseResults(
    submission?.testcaseResults || submitOutput?.testcaseResults,
    "hidden_testcase",
  );

  const fallbackFailedCase = normalizeTestcaseResult(
    submission?.failedCase || submitOutput?.firstFailedTestcase,
    "hidden_testcase",
  );

  return {
    status,
    passedCount: Number(submission?.passedCount ?? 0),
    totalCount: Number(submission?.totalCount ?? 0),
    runtime: normalizeText(submission?.runtime),
    memory: submission?.memory ?? null,
    failedCase: submission?.failedCase || null,
    firstFailedCase: fallbackFailedCase,
    testcaseResults: testcaseResults.length
      ? testcaseResults
      : fallbackFailedCase
        ? [fallbackFailedCase]
        : [],
  };
};

const TextBlock = ({ title, value }) => (
  <div className="space-y-2">
    <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
      {title}
    </div>
    <pre className="p-3 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[11px] font-mono text-[var(--text-color-primary)] whitespace-pre-wrap break-words">
      {normalizeText(value) || EMPTY_TEXT}
    </pre>
  </div>
);

const TestcaseResultCard = ({ testcase }) => {
  if (!testcase) return null;

  return (
    <div className="space-y-3 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
          {Number.isInteger(testcase.testcaseIndex)
            ? `Testcase #${testcase.testcaseIndex + 1}`
            : "Testcase"}
        </span>
        <span
          className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusTone(
            testcase.status,
          )}`}
        >
          {testcase.status}
        </span>
        {testcase.source ? (
          <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
            Source: {testcase.source}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextBlock title="Expected Output" value={testcase.expectedOutput} />
        <TextBlock title="Actual Output" value={testcase.actualOutput} />
      </div>
      {testcase.message ? (
        <div className="text-[11px] text-[var(--text-color-secondary)] whitespace-pre-wrap">
          {testcase.message}
        </div>
      ) : null}
    </div>
  );
};

const OutputPanel = ({
  error,
  runOutput,
  submitOutput,
  running,
  submitting,
}) => {
  const run = readRunPayload(runOutput);
  const submission = readSubmitPayload(submitOutput);
  const hasResult = Boolean(run || submission);

  console.log(run);

  if (error) {
    return (
      <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[12px] font-medium whitespace-pre-wrap">
        {error}
      </div>
    );
  }

  if (!hasResult && (running || submitting)) {
    return (
      <div className="h-full flex items-center justify-center text-[11px] font-bold text-[var(--text-color-muted)]">
        {running ? "Running..." : "Submitting..."}
      </div>
    );
  }

  if (submission) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusTone(
              submission.status,
            )}`}
          >
            {submission.status}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
            Passed {submission.passedCount}/{submission.totalCount}
          </span>
          {submission.runtime ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Runtime: {submission.runtime}s
            </span>
          ) : null}
          {submission.memory !== null && submission.memory !== undefined ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Memory: {submission.memory} KB
            </span>
          ) : null}
        </div>

        {submission.testcaseResults.length ? (
          <div className="space-y-3">
            {submission.testcaseResults.map((testcase, index) => (
              <TestcaseResultCard
                key={`${testcase.testcaseIndex ?? "case"}-${index}`}
                testcase={testcase}
              />
            ))}
          </div>
        ) : submission.firstFailedCase ? (
          <TestcaseResultCard testcase={submission.firstFailedCase} />
        ) : submission.failedCase ? (
          <div className="space-y-3 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
              Failed Case #{submission.failedCase.index ?? "-"}
            </div>
            <TextBlock
              title="Expected Output"
              value={submission.failedCase.expectedOutput}
            />
            <TextBlock
              title="Actual Output"
              value={submission.failedCase.actualOutput}
            />
            {submission.failedCase.message ? (
              <div className="text-[11px] text-[var(--text-color-secondary)]">
                {submission.failedCase.message}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (run) {
    const shouldShowExecutionStatus =
      normalizeText(run.executionStatus).toLowerCase() &&
      normalizeText(run.executionStatus).toLowerCase() !==
        normalizeText(run.status).toLowerCase();

    const shouldShowExpectedActual =
      run.source === "visible_testcase" ||
      Boolean(run.expectedOutput) ||
      Boolean(run.actualOutput) ||
      typeof run.matchedExpected === "boolean";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getStatusTone(
              run.status,
            )}`}
          >
            {run.status}
          </span>
          {run.source ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Source: {run.source}
            </span>
          ) : null}
          {Number.isInteger(run.testcaseIndex) ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Testcase #{run.testcaseIndex + 1}
            </span>
          ) : null}
          {run.time ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Runtime: {run.time}s
            </span>
          ) : null}
          {run.memory !== null && run.memory !== undefined ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Memory: {run.memory} KB
            </span>
          ) : null}
          {shouldShowExecutionStatus ? (
            <span className="text-[10px] font-mono text-[var(--text-color-muted)]">
              Execution: {run.executionStatus}
            </span>
          ) : null}
          {run.matchedExpected === true ? (
            <span className="text-[10px] font-mono text-emerald-400">
              Matched expected output
            </span>
          ) : null}
          {run.matchedExpected === false ? (
            <span className="text-[10px] font-mono text-amber-300">
              Did not match expected output
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextBlock title="Stdout" value={run.stdout} />
          <TextBlock title="Stderr" value={run.stderr} />
          <TextBlock title="Compile Output" value={run.compileOutput} />
          <TextBlock title="Message" value={run.message} />
        </div>

        {shouldShowExpectedActual ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextBlock title="Expected Output" value={run.expectedOutput} />
            <TextBlock title="Actual Output" value={run.actualOutput} />
          </div>
        ) : null}

        {run.testcaseResults.length ? (
          <div className="space-y-3">
            {run.testcaseResults.map((testcase, index) => (
              <TestcaseResultCard
                key={`${testcase.testcaseIndex ?? "case"}-${index}`}
                testcase={testcase}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-color-muted)] opacity-60">
      Run code to see output
    </div>
  );
};

export default React.memo(OutputPanel);
