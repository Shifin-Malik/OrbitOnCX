import asyncHandler from "express-async-handler";
import { getMentorReply } from "../../services/groqService.js";

export const chatWithAi = asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === "object" ? req.body : {};

  try {
    const reply = await getMentorReply({
      message: body.message,
      code: body.code,
      language: body.language,
      problemTitle: body.problemTitle,
      problemDescription: body.problemDescription,
      compilerOutput: body.compilerOutput,
      mode: body.mode,
    });

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    if (error.message === "Message is required") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (error.message === "GROQ_API_KEY is not configured") {
      return res.status(500).json({
        success: false,
        message: "AI service is not configured",
      });
    }

    return res.status(502).json({
      success: false,
      message: "Failed to get AI response",
    });
  }
});
