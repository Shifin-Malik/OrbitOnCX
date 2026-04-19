import React, { useState, useEffect, useRef, useCallback } from "react";
import { HiSparkles, HiPaperAirplane, HiLockClosed } from "react-icons/hi";
import { askAiChatAPI } from "../features/api.js";

const AIChatbot = ({
  code = "",
  language = "",
  compilerOutput = "",
  problemTitle = "",
  problemDescription = "",
  error = "",
  externalQuery = "",
  clearExternalQuery = () => {},
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

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const resolveMode = (query) => {
    const q = String(query || "").toLowerCase();

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

  const appendAiMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { role: "ai", text }]);
  }, []);

  const appendUserMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
  }, []);

  const handleSendQuery = useCallback(
    async (textQuery) => {
      const query = String(textQuery || "").trim();
      if (!query || isTyping) return;

      if (!isLoggedIn) {
        appendAiMessage("🔒 Please log in to use the AI assistant.");
        setInput("");
        return;
      }

      appendUserMessage(query);
      setInput("");
      setIsTyping(true);

      try {
        const { data } = await askAiChatAPI({
          message: query,
          code: typeof code === "string" ? code : "",
          language: typeof language === "string" ? language : "",
          compilerOutput:
            (typeof compilerOutput === "string" && compilerOutput) ||
            (typeof error === "string" && error) ||
            "",
          problemTitle: typeof problemTitle === "string" ? problemTitle : "",
          problemDescription:
            typeof problemDescription === "string" ? problemDescription : "",
          mode: resolveMode(query),
        });

        const reply =
          data?.reply ||
          "I could not generate a response for that yet. Please try again.";

        appendAiMessage(reply);
      } catch (err) {
        let message =
          "AI assistant is unavailable right now. Please try again shortly.";

        if (err?.response?.status === 401) {
          message = "🔒 Please log in to use the AI assistant.";
        } else if (err?.response?.status === 429) {
          message = "⚠️ AI usage limit reached. Please try again later.";
        } else if (err?.response?.status === 500) {
          message = "⚠️ AI server error. Please try again.";
        } else if (err?.response?.status === 502) {
          message = "⚠️ Failed to get AI response. Please try again.";
        } else if (err?.response?.data?.message) {
          message = err.response.data.message;
        }

        appendAiMessage(message);
      } finally {
        setIsTyping(false);
      }
    },
    [
      appendAiMessage,
      appendUserMessage,
      code,
      language,
      compilerOutput,
      error,
      problemTitle,
      problemDescription,
      isLoggedIn,
      isTyping,
    ],
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!externalQuery) return;

    handleSendQuery(externalQuery);

    if (typeof clearExternalQuery === "function") {
      clearExternalQuery();
    }
  }, [externalQuery, clearExternalQuery, handleSendQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendQuery(input);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] relative">
      <div className="flex-1 overflow-y-auto p-5 space-y-5 font-sans text-sm scrollbar-hide">
        {!isLoggedIn && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-danger-glow)] border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-xs font-bold">
              <HiLockClosed size={14} />
              Login required to use AI Assistant
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
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
                  <HiSparkles size={12} />
                  Orbiton AI
                </div>
              )}
              <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
            </div>
          </div>
        ))}

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

      <form
        onSubmit={handleSubmit}
        className="p-3 bg-[var(--color-background-soft)] border-t border-[var(--border-color-primary)] flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isLoggedIn
              ? "Ask for hints, explain logic, or fix bugs..."
              : "Login to use AI assistant"
          }
          className="flex-1 bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] focus:border-[var(--color-primary)] rounded-xl px-4 py-3 text-xs text-[var(--text-color-primary)] outline-none transition-all placeholder:text-[var(--text-color-muted)] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isTyping || !isLoggedIn}
        />

        <button
          type="submit"
          disabled={!input.trim() || isTyping || !isLoggedIn}
          className="bg-[var(--color-primary)] text-white p-3 rounded-xl hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-md"
          title={isLoggedIn ? "Send" : "Login required"}
        >
          <HiPaperAirplane className="rotate-90" size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIChatbot;
