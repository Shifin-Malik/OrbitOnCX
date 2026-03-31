import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const InputField = ({
  label,
  value,
  name,
  onChange,
  type = "text",
  placeholder,
  icon,
  compact,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const isPasswordField = type === "password";

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[9px] font-black uppercase opacity-50 ml-2 flex items-center gap-2">
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type={isPasswordField ? (isVisible ? "text" : "password") : type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className={`w-full ${compact ? "p-3" : "p-4"} bg-background-elevated border-2 border-transparent focus:border-primary rounded-xl outline-none text-sm font-bold transition-all ${isPasswordField ? "pr-10" : ""}`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors"
          >
            {isVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
