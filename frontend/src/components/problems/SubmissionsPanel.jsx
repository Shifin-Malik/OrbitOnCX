import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMySubmissions } from "../../features/submissions/submissionSlice.js";

const SubmissionsPanel = ({ slug }) => {
  const dispatch = useDispatch();
  const { mySubmissions, submissionsLoading } = useSelector(
    (s) => s.submissions,
  );

  useEffect(() => {
    if (!slug) return;
    dispatch(fetchMySubmissions({ slug, params: { page: 1, limit: 20 } }));
  }, [dispatch, slug]);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
        My Submissions
      </div>
      {submissionsLoading ? (
        <div className="text-[12px] font-bold text-[var(--text-color-muted)]">
          Loading…
        </div>
      ) : mySubmissions.length === 0 ? (
        <div className="text-[12px] font-bold text-[var(--text-color-muted)]">
          No submissions yet.
        </div>
      ) : (
        <div className="space-y-2">
          {mySubmissions.map((s) => (
            <div
              key={s._id}
              className="p-4 rounded-2xl border border-[var(--border-color-primary)] bg-[var(--color-background-elevated)] flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-widest">
                  {s.language} •{" "}
                  <span
                    className={s.isAccepted ? "text-emerald-500" : "text-rose-500"}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-color-muted)] font-mono">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] font-mono text-[var(--text-color-muted)]">
                {s.runtime ?? "—"}s • {s.memory ?? "—"}kb
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(SubmissionsPanel);

