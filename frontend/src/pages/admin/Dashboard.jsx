import React, { useEffect, useMemo } from "react";
import StatCard from "../../components/admin/StatCard";
import {
  FaUsers,
  FaUserCheck,
  FaCode,
  FaCircleQuestion,
  FaChartLine,
  FaShapes,
} from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { getDashboardStats } from "../../features/admin/adminSlice.js";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { dashboardStats, dashboardLoading, dashboardError } = useSelector(
    (s) => s.admin,
  );

  useEffect(() => {
    dispatch(getDashboardStats());
  }, [dispatch]);

  const totalUsers = dashboardStats?.totalUsers ?? 0;
  const activeUsers = dashboardStats?.activeUsers ?? 0;
  const totalProblems = dashboardStats?.totalProblems ?? 0;
  const totalQuizzes = dashboardStats?.totalQuizzes ?? 0;

  const formatNumber = (n) =>
    dashboardLoading ? "..." : Number(n || 0).toLocaleString();

  
  const trafficData = [30, 45, 35, 60, 55, 80, 75, 90, 85, 100];
  
  const activeRate = useMemo(
    () => (totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0),
    [activeUsers, totalUsers],
  );

  return (
    <div className="p-4 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
     
      <div className="flex justify-between items-center border-b border-[var(--border-color-primary)] pb-4">
        <div>
          <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-[0.3em]">
            System Core
          </p>
          <h2 className="text-2xl font-black text-[var(--text-color-primary)] tracking-tighter italic uppercase">
            Console <span className="opacity-20 font-light">v3.0</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background-soft)]/50 border border-[var(--border-color-primary)] rounded-full text-[9px] font-bold text-[var(--text-color-secondary)] uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Analytics
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={formatNumber(totalUsers)} trend="+5.2%" icon={<FaUsers />} color="text-primary" bg="bg-primary/10" />
        <StatCard title="Active Now" value={formatNumber(activeUsers)} trend="Live" icon={<FaUserCheck />} color="text-emerald-400" bg="bg-emerald-500/10" isLive />
        <StatCard title="Problem Bank" value={formatNumber(totalProblems)} trend="Inventory" icon={<FaCode />} color="text-blue-400" bg="bg-blue-500/10" />
        <StatCard title="Quiz Pool" value={formatNumber(totalQuizzes)} trend="Active" icon={<FaCircleQuestion />} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* --- Visual Analytics Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Main Traffic Graph (2/3 width) */}
        <div className="lg:col-span-2 relative group overflow-hidden rounded-[2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)]/30 p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <FaChartLine className="text-[var(--color-primary)]" /> System Traffic
              </h3>
              <p className="text-[9px] text-[var(--text-color-muted)] font-bold uppercase mt-1">Real-time engagement flow</p>
            </div>
            <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[8px] font-black uppercase tracking-tighter">7D</span>
                <span className="px-2 py-1 rounded hover:bg-white/5 text-[var(--text-color-muted)] text-[8px] font-black uppercase tracking-tighter transition-colors cursor-pointer">24H</span>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="h-40 w-full relative">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* The Area */}
              <path
                d={`M 0 40 ${trafficData.map((val, i) => `L ${(i * 100) / (trafficData.length - 1)} ${40 - val / 3}`).join(" ")} L 100 40 Z`}
                fill="url(#chartGradient)"
              />
              {/* The Line */}
              <path
                d={`M 0 ${40 - trafficData[0] / 3} ${trafficData.map((val, i) => `L ${(i * 100) / (trafficData.length - 1)} ${40 - val / 3}`).join(" ")}`}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="0.8"
                strokeLinecap="round"
                className="drop-shadow-[0_0_5px_var(--color-primary)]"
              />
            </svg>
          </div>
        </div>

        {/* Content Distribution (1/3 width) */}
        <div className="rounded-[2rem] border border-[var(--border-color-primary)] bg-[var(--color-background-soft)]/30 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6">
              <FaShapes className="text-blue-400" /> Platform Mix
            </h3>
            
            <div className="space-y-5">
              <div className="group/item">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-[var(--text-color-secondary)]">Activity Rate</span>
                  <span className="text-emerald-400">{activeRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: `${activeRate}%` }} />
                </div>
              </div>

              <div className="group/item">
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-[var(--text-color-secondary)]">Problem Density</span>
                  <span className="text-blue-400">72%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `72%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border-color-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-color-muted)]">All nodes operational</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;