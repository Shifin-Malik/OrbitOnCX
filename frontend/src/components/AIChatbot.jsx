import React, { useState, useEffect, useRef, useCallback } from "react";
import { HiSparkles, HiPaperAirplane } from "react-icons/hi";
import { askAiChatAPI } from "../features/api.js";

const AIChatbot = ({
  code,
  language,
  compilerOutput,
  problemTitle,
  problemDescription,
  error,
  externalQuery,
  clearExternalQuery,
}) => {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I am your Orbiton AI Assistant.\n\nI am here to help you understand errors, give you hints, and explain concepts. I won't write the full code for you, but I'll guide you to the solution. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const resolveMode = (query) => {
    const q = query.toLowerCase();
    if (
      q.includes("optimiz") ||
      q.includes("time complexity") ||
      q.includes("space complexity") ||
      q.includes("performance")
    ) {
      return "optimize";
    }
    if (
      q.includes("debug") ||
      q.includes("fix") ||
      q.includes("error") ||
      q.includes("exception")
    ) {
      return "debug";
    }
    if (q.includes("full solution") || q.includes("complete solution")) {
      return "solution";
    }
    if (q.includes("explain") || q.includes("what is") || q.includes("how")) {
      return "explain";
    }
    return "hint";
  };

  const handleSendQuery = useCallback(
    async (textQuery) => {
      const query = (textQuery || "").trim();
      if (!query) return;

      setMessages((prev) => [...prev, { role: "user", text: query }]);
      setInput("");
      setIsTyping(true);

      try {
        const { data } = await askAiChatAPI({
          message: query,
          code,
          language,
          compilerOutput: compilerOutput || error || "",
          problemTitle,
          problemDescription,
          mode: resolveMode(query),
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text:
              data?.reply ||
              "I could not generate a response for that yet. Please try again.",
          },
        ]);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "AI assistant is unavailable right now. Please try again shortly.";
        setMessages((prev) => [...prev, { role: "ai", text: message }]);
      } finally {
        setIsTyping(false);
      }
    },
    [code, language, compilerOutput, error, problemTitle, problemDescription],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (externalQuery) {
      handleSendQuery(externalQuery);
      clearExternalQuery();
    }
  }, [externalQuery, clearExternalQuery, handleSendQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] relative">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans text-sm scrollbar-hide">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--color-primary)] text-white rounded-tr-sm shadow-md"
                  : "bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] text-[var(--text-color-secondary)] rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.role === "ai" && (
                <div className="flex items-center gap-1.5 mb-2 text-[var(--color-accent)] font-black uppercase text-[10px] tracking-widest">
                  <HiSparkles size={12} /> Orbiton AI
                </div>
              )}
              <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-bounce"></div>
              <div
                className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[var(--color-background-soft)] border-t border-[var(--border-color-primary)] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for hints, explain logic, or fix bugs..."
          className="flex-1 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-xs text-[var(--text-color-primary)] outline-none transition-all placeholder:text-[var(--text-color-muted)]"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="bg-[var(--color-primary)] text-white p-3 rounded-xl hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center shadow-md"
        >
          <HiPaperAirplane className="rotate-90" size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
