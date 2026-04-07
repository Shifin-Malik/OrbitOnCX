import React from "react";
import StatCard from "../../components/admin/StatCard";
import {
  FaUsers,
  FaUserCheck,
  FaCode,
  FaCircleQuestion,
} from "react-icons/fa6";

const Dashboard = () => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Header --- */}
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">
            System Intelligence
          </p>
          <h2 className="text-3xl font-black text-text-primary tracking-tight italic">
            CONSOLE OVERVIEW
          </h2>
          <div className="h-1 w-12 bg-primary rounded-full shadow-[0_0_10px_rgba(5,150,105,0.5)]"></div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-background-soft border border-border-primary rounded-2xl shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            Live Platform Analytics
          </span>
        </div>
      </div>

     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value="2,480"
          trend="+12% up"
          icon={<FaUsers />}
          color="text-primary"
          bg="bg-primary/5"
        />
        <StatCard
          title="Active Now"
          value="142"
          trend="Live"
          icon={<FaUserCheck />}
          color="text-emerald-500"
          bg="bg-emerald-500/5"
          isLive={true}
        />
        <StatCard
          title="Total Problems"
          value="850"
          trend="LeetCode"
          icon={<FaCode />}
          color="text-blue-500"
          bg="bg-blue-500/5"
        />
        <StatCard
          title="Total Questions"
          value="12,402"
          trend="Quiz pool"
          icon={<FaCircleQuestion />}
          color="text-purple-500"
          bg="bg-purple-500/5"
        />
      </div>
    </div>
  );
};

export default Dashboard;
