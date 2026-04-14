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

const readRunPayload = (runOutput) => {
  if (!runOutput) return null;

  const result = runOutput?.result || {};
  const runMeta = runOutput?.run || {};
  const legacyResults = Array.isArray(runOutput?.results) ? runOutput.results : [];
  const firstLegacy = legacyResults[0] || null;
  const firstFailedLegacy =
    legacyResults.find((item) => item?.isAccepted === false) || null;
  const selectedLegacy = firstFailedLegacy || firstLegacy;

  const statusText = prettifyStatus(
    result?.status?.description ||
      runMeta?.verdict ||
      runOutput?.status ||
      (runOutput?.isAccepted ? "Accepted" : "") ||
      selectedLegacy?.status ||
      "",
  );

  return {
    status: statusText,
    statusId: Number(result?.status?.id ?? 0) || 0,
    stdout: normalizeText(result?.stdout ?? selectedLegacy?.actualOutput),
    stderr: normalizeText(result?.stderr),
    compileOutput: normalizeText(result?.compile_output),
    message: normalizeText(result?.message),
    time: normalizeText(result?.time),
    memory: result?.memory ?? null,
    source: normalizeText(runMeta?.source),
    testcaseIndex:
      Number.isInteger(runMeta?.testcaseIndex) && runMeta.testcaseIndex >= 0
        ? runMeta.testcaseIndex
        : null,
    expectedOutput: normalizeText(runMeta?.expectedOutput ?? selectedLegacy?.expectedOutput),
    actualOutput: normalizeText(runMeta?.actualOutput ?? selectedLegacy?.actualOutput),
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

  return {
    status,
    passedCount: Number(submission?.passedCount ?? 0),
    totalCount: Number(submission?.totalCount ?? 0),
    runtime: normalizeText(submission?.runtime),
    memory: submission?.memory ?? null,
    failedCase: submission?.failedCase || null,
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

const OutputPanel = ({ error, runOutput, submitOutput, running, submitting }) => {
  const run = readRunPayload(runOutput);
  const submission = readSubmitPayload(submitOutput);
  const hasResult = Boolean(run || submission);

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

        {submission.failedCase ? (
          <div className="space-y-3 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
              Failed Case #{submission.failedCase.index ?? "-"}
            </div>
            <TextBlock title="Input" value={submission.failedCase.input} />
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
        </div>

        <TextBlock title="Stdout" value={run.stdout} />
        <TextBlock title="Stderr" value={run.stderr} />
        <TextBlock title="Compile Output" value={run.compileOutput} />
        <TextBlock title="Message" value={run.message} />

        {run.expectedOutput || run.actualOutput ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextBlock title="Expected Output" value={run.expectedOutput} />
            <TextBlock title="Actual Output" value={run.actualOutput} />
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
