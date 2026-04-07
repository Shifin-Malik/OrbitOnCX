import React from "react";
import { IoPeopleOutline, IoChatbubbleOutline } from "react-icons/io5";
import { FaBolt, FaTrophy, FaRobot, FaCode } from "react-icons/fa";

function Features() {
  const features = [
    {
      icon: IoPeopleOutline,
      title: "Real-Time Collaboration",
      desc: "Code together with live cursors, active user tracking, and instant sync across all participants.",
      color: "text-blue-500",
      darkColor: "dark:text-blue-400",
      bg: "bg-blue-50/50 dark:bg-blue-500/10",
    },
    {
      icon: FaBolt,
      title: "Multi-Language Compiler",
      desc: "Execute code in 40+ languages with our Judge0-powered online compiler. Instant feedback.",
      color: "text-amber-500",
      darkColor: "dark:text-amber-400",
      bg: "bg-amber-50/50 dark:bg-amber-500/10",
    },
    {
      icon: IoChatbubbleOutline,
      title: "Integrated Chat",
      desc: "Discuss code, share snippets, and communicate without leaving the editor.",
      color: "text-[var(--color-primary)]",
      darkColor: "dark:text-[var(--color-accent)]",
      bg: "bg-[var(--color-secondary)]/50 dark:bg-[var(--color-primary)]/10",
    },
    {
      icon: FaTrophy,
      title: "Quizzes & Rankings",
      desc: "Challenge yourself with coding quizzes and climb the leaderboard.",
      color: "text-rose-500",
      darkColor: "dark:text-rose-400",
      bg: "bg-rose-50/50 dark:bg-rose-500/10",
    },
    {
      icon: FaRobot,
      title: "AI Assistance",
      desc: "Get intelligent suggestions, code explanations, and debugging help instantly.",
      color: "text-violet-500",
      darkColor: "dark:text-violet-400",
      bg: "bg-violet-50/50 dark:bg-violet-500/10",
    },
    {
      icon: FaCode,
      title: "Professional Editor",
      desc: "Monaco-powered editor with syntax highlighting and smart features.",
      color: "text-emerald-500",
      darkColor: "dark:text-emerald-400",
      bg: "bg-emerald-50/50 dark:bg-emerald-500/10",
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 bg-background relative overflow-hidden transition-colors duration-500">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-primary opacity-5 dark:opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter mb-6">
            Everything You Need to <br />
            <span className="text-(--color-primary)">Code Together</span>
          </h2>
          <p className="text-secondary font-medium max-w-2xl mx-auto text-md">
            Professional-grade tools designed for seamless collaboration,
            interactive learning, and rapid development.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={index}
                className="group p-8 rounded-[2.5rem] bg-background-soft border border-primary hover:border-(--color-primary) transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
              >
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl ${feature.bg} ${feature.color} ${feature.darkColor} text-2xl mb-6 group-hover:scale-110 transition-all duration-500 shadow-sm`}
                >
                  <Icon />
                </div>

                <h3 className="text-xl text-primary font-black mb-3 tracking-tight">
                  {feature.title}
                </h3>

                <p className="text-secondary text-sm leading-relaxed font-medium">
                  {feature.desc}
                </p>

                <div className="mt-6 w-8 h-1 bg-(--border-color-secondary) rounded-full group-hover:w-16 group-hover:bg-primary transition-all duration-500"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
