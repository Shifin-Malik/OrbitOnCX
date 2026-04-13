import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

console.log("GROQ MODEL:", DEFAULT_GROQ_MODEL);
console.log("GROQ KEY EXISTS:", !!process.env.GROQ_API_KEY);

const MAX_MESSAGE_CHARS = 2000;
const MAX_CODE_CHARS = 12000;
const MAX_COMPILER_OUTPUT_CHARS = 4000;
const MAX_PROBLEM_TITLE_CHARS = 180;
const MAX_PROBLEM_DESCRIPTION_CHARS = 5000;

const ALLOWED_MODES = new Set([
  "hint",
  "debug",
  "explain",
  "optimize",
  "solution",
]);

let groqClient = null;

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const trimWithLimit = (value, maxChars) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}\n...[truncated]`;
};

const normalizeMode = (value) => {
  const mode = normalizeText(value).toLowerCase();
  return ALLOWED_MODES.has(mode) ? mode : "hint";
};

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
};

const buildInput = ({
  message,
  code,
  language,
  problemTitle,
  problemDescription,
  compilerOutput,
  mode,
}) => {
  const contextParts = [
    `Mode: ${mode}`,
    `Language: ${language || "not provided"}`,
    "",
    "Student question:",
    message,
  ];

  if (problemTitle) contextParts.push("", "Problem title:", problemTitle);
  if (problemDescription)
    contextParts.push("", "Problem description:", problemDescription);

  if (code) {
    contextParts.push(
      "",
      "Current code:",
      `\`\`\`${language || "text"}`,
      code,
      "```",
    );
  }

  if (compilerOutput) {
    contextParts.push(
      "",
      "Compiler/runtime output:",
      "```text",
      compilerOutput,
      "```",
    );
  }

  return contextParts.join("\n");
};

export const getMentorReply = async (payload = {}) => {
  const sanitized = {
    message: trimWithLimit(payload.message, MAX_MESSAGE_CHARS),
    code: trimWithLimit(payload.code, MAX_CODE_CHARS),
    language: trimWithLimit(payload.language, 40).toLowerCase(),
    problemTitle: trimWithLimit(payload.problemTitle, MAX_PROBLEM_TITLE_CHARS),
    problemDescription: trimWithLimit(
      payload.problemDescription,
      MAX_PROBLEM_DESCRIPTION_CHARS,
    ),
    compilerOutput: trimWithLimit(
      payload.compilerOutput,
      MAX_COMPILER_OUTPUT_CHARS,
    ),
    mode: normalizeMode(payload.mode),
  };

  if (!sanitized.message) {
    throw new Error("Message is required");
  }

  try {
    const client = getGroqClient();
    const userInput = buildInput(sanitized);

    console.log("Sending request to Groq...");

    const response = await client.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: [
            "You are OrbitonCX AI Mentor, a friendly coding tutor for beginners.",
            "You do not execute code. The platform compiler handles execution.",
            "Prioritize teaching over giving final answers.",
            "Response rules:",
            "- Be concise, clear, and beginner-friendly.",
            "- Use markdown and fenced code blocks when showing code.",
            "- Explain errors in simple terms and identify likely root causes.",
            "- If mode is hint, guide step-by-step and avoid full solutions unless explicitly requested.",
            "- If mode is debug, inspect the provided code and compiler output first.",
            "- If mode is optimize, mention time/space complexity impact when relevant.",
            "- Stay focused on coding help only.",
          ].join("\n"),
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty response from Groq");
    }

    console.log("Successfully received AI response!");
    return reply;
  } catch (error) {
    console.error("\n=============================================");
    console.error("GROQ API ACTUAL ERROR DETAILS:");
    console.error(error?.message || error);
    console.error("=============================================\n");
    throw error;
  }
};
