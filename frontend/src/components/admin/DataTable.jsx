import React from "react";

const DataTable = ({ headers, children }) => (
  <div className="w-full overflow-hidden rounded-3xl border border-border-primary bg-background-soft shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead className="bg-background-elevated">
        <tr>
          {headers.map((h, i) => (
            <th key={i} className="px-6 py-4 text-[10px] font-black text-text-muted uppercase tracking-widest">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border-primary">
        {children}
      </tbody>
    </table>
  </div>
);

export default DataTable;