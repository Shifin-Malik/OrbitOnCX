import React from "react";

const StatCard = ({ title, value, icon, color, bg, trend, isLive }) => {
  return (
  
    <div className="group relative bg-background-soft border border-white/40 p-6 rounded-[2rem] transition-all duration-500 hover:-translate-y-1.5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5">
    
      <div className="absolute -top-1 -right-1 p-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
        <div className="scale-[2] rotate-12">{icon}</div>
      </div>

  
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>

      <div className="flex justify-between items-start relative z-10">
       
        <div className="relative">
          <div
            className={`absolute inset-0 ${bg} blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
          ></div>
          <div
            className={`relative p-3.5 rounded-xl ${bg} ${color} text-xl shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3`}
          >
            {icon}
          </div>
        </div>

       
        {trend && (
          <span
            className={`text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-md border backdrop-blur-md transition-all ${
              isLive
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 animate-pulse"
                : "bg-background-elevated/50 border-border-primary/40 text-text-muted"
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      <div className="mt-6 relative z-10">
        <div className="space-y-0.5">
   
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            {title}
          </p>
          <div className="flex items-center gap-3">
         
            <h3 className="text-3xl font-black text-text-primary tracking-tight group-hover:text-primary transition-colors duration-300">
              {value}
            </h3>

            <div className="flex gap-0.5 items-end h-4 pb-0.5 opacity-20 group-hover:opacity-100 transition-all duration-700">
              <div
                className={`w-0.5 h-1.5 rounded-full ${color.replace("text", "bg")} opacity-40`}
              ></div>
              <div
                className={`w-0.5 h-3.5 rounded-full ${color.replace("text", "bg")} opacity-70`}
              ></div>
              <div
                className={`w-0.5 h-2.5 rounded-full ${color.replace("text", "bg")} opacity-90`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-background-elevated overflow-hidden">
        <div
          className={`h-full w-0 group-hover:w-full transition-all duration-1000 ease-out ${color.replace("text", "bg")}`}
        ></div>
      </div>
    </div>
  );
};

export default StatCard;
