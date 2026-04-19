import React, { useEffect } from "react";
import ModernBar from "./ModernBar";
import { useDispatch, useSelector } from "react-redux";
import { fetchProblems } from "../../features/problems/problemSlice";

const ProfileStats = ({ user }) => {
  const dispatch = useDispatch();

  const { list, total, loadingList, listError } = useSelector(
    (state) => state.problems,
  );

  useEffect(() => {
    dispatch(fetchProblems({ page: 1, limit: 100 }));
  }, [dispatch]);

  const solved = user?.stats?.totalSolved || 0;
  const totalProblems = total || list.length || 100;
  const offset = 502 - 502 * (solved / totalProblems);
  const easyTotal = list.filter(
    (problem) => problem.difficulty === "Easy",
  ).length;
  const mediumTotal = list.filter(
    (problem) => problem.difficulty === "Medium",
  ).length;
  const hardTotal = list.filter(
    (problem) => problem.difficulty === "Hard",
  ).length;

  const items = [
    {
      label: "Easy",
      solved: user?.stats?.easySolved || 0,
      total: easyTotal,
      color: "bg-emerald-400",
    },
    {
      label: "Medium",
      solved: user?.stats?.mediumSolved || 0,
      total: mediumTotal,
      color: "bg-amber-400",
    },
    {
      label: "Hard",
      solved: user?.stats?.hardSolved || 0,
      total: hardTotal,
      color: "bg-rose-400",
    },
  ];

  return (
    <section className="bg-background-soft border border-primary/20 rounded-[3rem] p-8 md:p-12 shadow-xl relative overflow-hidden">
      <header className="flex items-center gap-4 mb-12">
        <span className="w-2.5 h-10 bg-primary rounded-full" />
        <h3 className="text-2xl font-black uppercase tracking-tighter">
          Performance Overview
        </h3>
      </header>

      {loadingList && <p>Loading problems...</p>}
      {listError && <p className="text-red-500">{listError}</p>}

      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div className="relative flex justify-center scale-110 md:scale-125">
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-background-elevated"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray="502"
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black">{solved}</span>
            <span className="text-[10px] font-black uppercase opacity-40 mt-1">
              Solved / {totalProblems}
            </span>
          </div>
        </div>

        <div className="space-y-7">
          {items.map((item) => (
            <ModernBar key={item.label} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(ProfileStats);
