import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchProblems } from "../../features/problems/problemSlice.js";
import { FaCheckCircle, FaTerminal, FaChevronDown } from "react-icons/fa";

const difficultyColor = (d) => {
  if (d === "Easy") return "text-emerald-500";
  if (d === "Medium") return "text-amber-500";
  return "text-rose-500";
};

const statusIcon = (s) => {
  if (s === "solved")
    return <FaCheckCircle className="text-emerald-500 text-sm" />;
  if (s === "attempted")
    return <FaTerminal className="text-amber-500 text-xs" />;
  return (
    <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-color-muted)] opacity-20 ml-1" />
  );
};

const ProblemListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loadingList, listError, page, totalPages, total } = useSelector(
    (s) => s.problems,
  );

  const { user } = useSelector((state) => state.auth);
  console.log(user.stats.totalSolved);

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [status, setStatus] = useState("");
  const [pageNum, setPageNum] = useState(1);

  const params = useMemo(
    () => ({
      search: query || undefined,
      difficulty: difficulty || undefined,
      status: status || undefined,
      page: pageNum,
      limit: 20,
    }),
    [query, difficulty, status, pageNum],
  );

  console.log(user);

  useEffect(() => {
    const t = setTimeout(() => {
      dispatch(fetchProblems(params));
    }, 250);
    return () => clearTimeout(t);
  }, [dispatch, params]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--text-color-primary)] pt-24 pb-16 px-4 md:px-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Problems
          </h1>
          <div className="flex gap-4 text-sm font-semibold">
            <span className="text-green-500 font-bold">
              Easy: {user?.stats?.totalSolved || 0}
            </span>
            <span className="text-yellow-500 font-bold">
              Medium: {user?.stats?.mediumSolved || 0}
            </span>
            <span className="text-red-500 font-bold">
              Advanced: {user?.stats?.hardSolved || 0}
            </span>
          </div>
        </div>

        <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl p-4 md:p-5 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPageNum(1);
              }}
              placeholder="Search by title…"
              className="flex-1 px-4 py-3 rounded-2xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] outline-none text-sm"
            />

            <div className="grid grid-cols-2 md:flex gap-3">
              <div className="relative">
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    setPageNum(1);
                  }}
                  className="w-full appearance-none px-4 py-3 rounded-2xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] text-sm font-bold"
                >
                  <option value="">All Difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPageNum(1);
                  }}
                  className="w-full appearance-none px-4 py-3 rounded-2xl bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] text-sm font-bold"
                >
                  <option value="">All Status</option>
                  <option value="solved">Solved</option>
                  <option value="attempted">Attempted</option>
                  <option value="unsolved">Unsolved</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] opacity-40 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-3xl overflow-hidden">
          <div className="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-color-primary)]/60 text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)] bg-[var(--color-background-elevated)]">
            <div className="col-span-1">Status</div>
            <div className="col-span-6">Title</div>
            <div className="col-span-2 text-center">Difficulty</div>
            <div className="col-span-2 text-center">Tags</div>
            <div className="col-span-1 text-right">AC%</div>
          </div>

          {loadingList ? (
            <div className="p-10 text-center text-[12px] font-bold text-[var(--text-color-muted)]">
              Loading…
            </div>
          ) : listError ? (
            <div className="p-10 text-center text-[12px] font-bold text-rose-500">
              {listError}
            </div>
          ) : list.length === 0 ? (
            <div className="p-10 text-center text-[12px] font-bold text-[var(--text-color-muted)]">
              No problems found.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color-primary)]/40">
              {list.map((p) => (
                <button
                  key={p._id}
                  onClick={() => navigate(`/leetcode/${p.slug}`)}
                  className="w-full text-left grid grid-cols-12 items-center px-6 py-4 hover:bg-[var(--color-primary)]/[0.03] transition-colors"
                >
                  <div className="col-span-1">{statusIcon(p.solveStatus)}</div>
                  <div className="col-span-6">
                    <div className="text-sm font-bold text-[var(--text-color-primary)]">
                      {p.title}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-color-muted)] mt-1">
                      Submissions: {p.submissionCount || 0} • Accepted:{" "}
                      {p.acceptanceCount || 0}
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`text-[10px] font-black ${difficultyColor(
                        p.difficulty,
                      )}`}
                    >
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-[10px] text-[var(--text-color-muted)]">
                      {(p.tags || []).slice(0, 2).join(", ") || "—"}
                    </span>
                  </div>
                  <div className="col-span-1 text-right text-xs font-mono text-[var(--text-color-secondary)] opacity-70">
                    {(p.acceptanceRate || 0).toFixed(1)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-[var(--text-color-muted)]">
            Total: {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pageNum <= 1}
              onClick={() => setPageNum((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Prev
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-muted)]">
              {page} / {totalPages}
            </div>
            <button
              disabled={pageNum >= totalPages}
              onClick={() => setPageNum((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl border border-[var(--border-color-primary)] bg-[var(--color-background-soft)] text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemListPage;
