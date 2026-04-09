import React from "react";

const OutputPanel = ({ error, runOutput, submitOutput }) => {
  if (error) {
    return <pre className="text-rose-500 whitespace-pre-wrap">{error}</pre>;
  }

  if (submitOutput) {
    const failed = submitOutput?.submission?.failedTestCaseSummary;
    return (
      <pre className="whitespace-pre-wrap text-[var(--text-color-secondary)]">
{submitOutput.isAccepted ? "Accepted" : `Result: ${submitOutput.status}`}
{failed ? `\nFailed at hidden case #${failed.failedAt + 1}` : ""}
      </pre>
    );
  }

  if (runOutput) {
    return (
      <div className="space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
          Sample tests
        </div>
        {(runOutput.results || []).map((r) => (
          <div
            key={r.index}
            className="p-3 rounded-2xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)]"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black uppercase tracking-widest">
                Case {r.index + 1}
              </div>
              <div
                className={`text-[10px] font-black uppercase ${
                  r.isAccepted ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {r.status}
              </div>
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-[11px] text-[var(--text-color-secondary)]">
Input:
{r.input}

Expected:
{r.expectedOutput}

Actual:
{r.actualOutput}
            </pre>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.6em] text-[var(--text-color-muted)] opacity-50">
      Idle
    </div>
  );
};

export default React.memo(OutputPanel);

