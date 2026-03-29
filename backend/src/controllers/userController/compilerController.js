import axios from "axios";
import CodeDraft from "../../models/codeDraft.js";

const languageIds = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  php: 68,
};

const MAX_CODE_LENGTH = 10000;

const isValidObjectIdLike = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const validateCodePayload = ({ language, code }) => {
  const langId = languageIds[language];

  if (!langId) {
    return { isValid: false, message: "Invalid language" };
  }

  if (!code?.trim()) {
    return { isValid: false, message: "Code is required" };
  }

  if (code.length > MAX_CODE_LENGTH) {
    return {
      isValid: false,
      message: `Code is too long! Max ${MAX_CODE_LENGTH.toLocaleString()} characters allowed`,
    };
  }

  return { isValid: true, langId };
};

export const executeCode = async (req, res) => {
  const { language, code } = req.body;

  const validation = validateCodePayload({ language, code });

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
    });
  }

  try {
    const response = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        language_id: validation.langId,
        source_code: code,
        cpu_time_limit: 2,
        wall_time_limit: 5,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const result = response.data;
    const statusId = result?.status?.id;
    const statusDescription = result?.status?.description || "Unknown";

    const isSuccess = statusId === 3;
    const isTLE = statusId === 5;

    const finalOutput = isTLE
      ? "Time Limit Exceeded (Possible infinite loop detected)"
      : result?.stdout ??
        result?.stderr ??
        result?.compile_output ??
        "No output";

    return res.status(200).json({
      success: isSuccess && !isTLE,
      output: finalOutput,
      time: result?.time ?? null,
      memory: result?.memory ?? null,
      status: isTLE ? "Time Limit Exceeded" : statusDescription,
    });
  } catch (error) {
    console.error("Judge0 Error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Compiler backend error",
      error: error.response?.data || error.message,
    });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { userId, language, code = "" } = req.body;

    if (!isValidObjectIdLike(userId) || !language) {
      return res.status(400).json({
        success: false,
        message: "userId and language are required",
      });
    }

    if (code.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Code is too long! Max ${MAX_CODE_LENGTH.toLocaleString()} characters allowed`,
      });
    }

    const updatedDraft = await CodeDraft.findOneAndUpdate(
      { userId, language },
      {
        $set: {
          code,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Draft saved successfully",
      draft: updatedDraft,
    });
  } catch (error) {
    if (error.code === 11000) {
      try {
        const { userId, language, code = "" } = req.body;

        const existingDraft = await CodeDraft.findOneAndUpdate(
          { userId, language },
          {
            $set: {
              code,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        return res.status(200).json({
          success: true,
          message: "Draft saved successfully",
          draft: existingDraft,
        });
      } catch (retryError) {
        return res.status(500).json({
          success: false,
          message: "Draft save failed",
          error: retryError.message,
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Draft save failed",
      error: error.message,
    });
  }
};

export const getDraft = async (req, res) => {
  try {
    const { userId, language } = req.query;

    if (!isValidObjectIdLike(userId) || !language) {
      return res.status(400).json({
        success: false,
        message: "userId and language are required",
      });
    }

    const draft = await CodeDraft.findOne({ userId, language }).lean();

    return res.status(200).json({
      success: true,
      code: draft?.code || "",
      draft: draft || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Draft fetch failed",
      error: error.message,
    });
  }
};