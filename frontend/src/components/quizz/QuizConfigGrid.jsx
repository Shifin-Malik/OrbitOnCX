import React from "react";
import { motion } from "framer-motion";
import {
  FaLayerGroup,
  FaClock,
  FaShieldAlt,
  FaGlobe,
  FaChevronDown,
} from "react-icons/fa";

const QuizConfigGrid = ({
  isEditing,
  editForm,
  setEditForm,
  difficultyLevels,
}) => {
  const StatCard = ({
    icon: Icon,
    iconColor,
    label,
    value,
    field,
    isEditableField = false, // ഈ ഫീൽഡ് എഡിറ്റ് ചെയ്യാൻ പറ്റുമോ എന്ന് തീരുമാനിക്കുന്നു
    options = [],
  }) => (
    <motion.div
      layout
      className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 ${
        isEditing && isEditableField
          ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 shadow-[0_0_15px_var(--color-accent-glow)] ring-1 ring-[var(--color-primary)]/20"
          : "bg-[var(--color-background-elevated)] border-[var(--border-color-primary)]"
      }`}
    >
      <div
        className={`p-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--border-color-primary)] ${iconColor} flex-shrink-0`}
      >
        <Icon size={10} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 text-left">
        <span className="text-[6.5px] font-black text-[var(--text-color-muted)] uppercase tracking-[0.15em] mb-0.5">
          {label}
        </span>

       
        {isEditing && isEditableField ? (
          <div className="relative flex items-center">
            <select
              className="w-full bg-transparent text-[10px] font-black text-[var(--text-color-primary)] outline-none cursor-pointer appearance-none z-10"
              value={value}
              onChange={(e) =>
                setEditForm({ ...editForm, [field]: e.target.value })
              }
            >
              {options.map((opt) => (
                <option
                  key={opt}
                  value={opt}
                  className="bg-[var(--color-background-soft)]"
                >
                  {opt}
                </option>
              ))}
            </select>
            <FaChevronDown
              size={6}
              className="absolute right-0 text-[var(--text-color-muted)] pointer-events-none"
            />
          </div>
        ) : (
          <span className="text-[10px] font-black text-[var(--text-color-primary)] truncate italic opacity-90">
            {value}
            {label === "Questions" ? " Qs" : label === "Time" ? " Mins" : ""}
          </span>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Read Only Stats */}
      <StatCard
        icon={FaLayerGroup}
        iconColor="text-[var(--color-primary)]"
        label="Questions"
        value={editForm.questions}
      />
      <StatCard
        icon={FaClock}
        iconColor="text-[var(--color-primary)]/70"
        label="Time"
        value={editForm.time}
      />

      {/* Editable Difficulty Level */}
      <StatCard
        icon={FaShieldAlt}
        iconColor="text-[var(--color-primary)]"
        label="Level"
        value={editForm.difficulty}
        field="difficulty"
        isEditableField={true} // Difficulty മാത്രം എഡിറ്റ് ചെയ്യാം
        options={difficultyLevels}
      />

      {/* Read Only Access Level */}
      <StatCard
        icon={FaGlobe}
        iconColor="text-[var(--color-primary)]/80"
        label="Access"
        value={editForm.status}
      />
    </div>
  );
};

export default QuizConfigGrid;
