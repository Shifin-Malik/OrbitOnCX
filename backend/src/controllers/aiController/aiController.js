import asyncHandler from "express-async-handler";
import { getMentorReply } from "../../services/geminiService.js";

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
      res.status(400);
      throw new Error("Message is required");
    }

    if (error.message === "GEMINI_API_KEY is not configured") {
      res.status(500);
      throw new Error("AI service is not configured");
    }

    res.status(502);
    throw new Error("Failed to get AI response");
  }
});

