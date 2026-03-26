import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";

const customStyles = `
  .heatmap-card {
    background: var(--color-background-soft);
    border: 1px solid var(--border-color-primary);
    border-radius: 2.5rem;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    max-width: 850px;
    margin: 20px auto;
    transition: all 0.3s ease;
  }
  
  .heatmap-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 900;
    color: var(--text-color-primary);
    letter-spacing: -0.025em;
  }

  /* Heatmap Squares Base */
  .react-calendar-heatmap .color-empty { 
    fill: var(--color-background-elevated); 
  }

  /* Heatmap Levels - Using CSS Variables for automatic Dark Mode */
  .react-calendar-heatmap .level-1 { fill: #d1fae5; } /* Light Emerald */
  .react-calendar-heatmap .level-2 { fill: #6ee7b7; } /* Mid Emerald */
  .react-calendar-heatmap .level-3 { fill: var(--color-accent); } 
  .react-calendar-heatmap .level-4 { fill: var(--color-primary); }

  /* Dark Mode Specific Overrides for Levels 1 & 2 to keep them visible */
  .dark .react-calendar-heatmap .level-1 { fill: #064e3b; }
  .dark .react-calendar-heatmap .level-2 { fill: #065f46; }

  .react-calendar-heatmap rect {
    rx: 4;
    ry: 4;
    transition: fill 0.3s ease;
  }

  .react-calendar-heatmap rect:hover {
    stroke: var(--color-accent);
    stroke-width: 1.5px;
    opacity: 0.8;
  }

  .legend {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-color-muted);
    margin-top: 16px;
  }

  .legend-box {
    width: 10px;
    height: 10px;
    margin: 0 3px;
    border-radius: 3px;
    transition: background 0.3s ease;
  }
`;

const ActivityHeatmap = ({ userActivities }) => {
  const today = new Date();
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - 1);

  const generateDummyData = () => {
    const data = [];
    for (let i = 0; i < 80; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 300));
      data.push({
        date: date.toISOString().split("T")[0],
        count: Math.floor(Math.random() * 5),
      });
    }
    return data;
  };

  const values = userActivities || generateDummyData();

  return (
    <div className="heatmap-card">
      <style>{customStyles}</style>

      <div className="heatmap-header">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          <h3>Activity Overview</h3>
        </div>
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
          {values.length} submissions in the last year
        </span>
      </div>

      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={values}
        classForValue={(value) => {
          if (!value || value.count === 0) return "color-empty";
          if (value.count >= 4) return "level-4";
          if (value.count >= 3) return "level-2"; 
          if (value.count >= 2) return "level-2";
          return "level-1";
        }}
        tooltipDataAttrs={(value) => {
          if (!value || !value.date)
            return { "data-tooltip-content": "No activity" };
          return {
            "data-tooltip-id": "heatmap-tooltip",
            "data-tooltip-content": `${value.date}: ${value.count} solved`,
          };
        }}
      />

      <div className="legend">
        <span>Less</span>
        <div className="legend-box bg-background-elevated"></div>
        <div className="legend-box bg-[#d1fae5]"></div>
        <div className="legend-box bg-[#6ee7b7] "></div>
        <div className="legend-box bg-accent"></div>
        <div className="legend-box bg-primary/90"></div>
        <span>More</span>
      </div>

      <Tooltip
        id="heatmap-tooltip"
        style={{
          backgroundColor: "var(--text-color-primary)",
          color: "var(--color-background-soft)",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "700",
        }}
      />
    </div>
  );
};

export default ActivityHeatmap;
