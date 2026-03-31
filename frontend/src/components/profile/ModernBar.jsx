const ModernBar = ({ label, solved, total, color }) => (
  <div className="w-full">
    <div className="flex justify-between items-center mb-1.5 font-black text-[9px] uppercase opacity-60 tracking-wider">
      <span>{label}</span>
      <span>
        {solved}/{total}
      </span>
    </div>
    <div className="h-2.5 w-full bg-background-elevated rounded-full overflow-hidden border border-primary/10">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
        style={{ width: `${(solved / total) * 100}%` }}
      ></div>
    </div>
  </div>
);
export default ModernBar;
