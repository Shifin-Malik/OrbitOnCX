import axios from "axios";
import CodeExecution from "../../models/compailerModel.js";
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

export const executeCode = async (req, res) => {
  const { language, code, userId } = req.body;
  const langId = languageIds[language];

  if (!langId || !code) {
    return res.status(400).json({ success: false, message: "Invalid Language or Code" });
  }

  try {
    
    const response = await axios.post(
      `https://ce.judge0.com/submissions?base64_encoded=false&wait=true`,
      { language_id: langId, source_code: code },
      { headers: { "Content-Type": "application/json" } }
    );

    const result = response.data;
    console.log(result)
    const finalOutput = result.stdout || result.stderr || result.compile_output || "No output";
    const isSuccess = result.status?.id === 3;

    
    if (userId) {
      CodeExecution.create({
        userId,
        language,
        code,
        output: finalOutput,
        status: isSuccess ? "Success" : "Error",
        time: result.time,
        memory: result.memory,
      }).catch(err => console.error("DB Save Error:", err.message));
    }

    return res.status(200).json({
      success: true,
      output: finalOutput,
      time: result.time,
      memory: result.memory,
      status: result.status?.description,
    });

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("Judge0 Error:", errorMsg);
    return res.status(500).json({ success: false, message: "Compiler backend error", error: error.message });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const { userId, language, code } = req.body;

    if (!userId || !language) {
      return res.status(400).json({
        success: false,
        message: "userId and language are required",
      });
    }

   const draft = await CodeDraft.findOneAndUpdate(
  { userId, language },
  { code },
  { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
);

    return res.status(200).json({
      success: true,
      message: "Draft saved",
      draft,
    });
  } catch (error) {
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

    if (!userId || !language) {
      return res.status(400).json({
        success: false,
        message: "userId and language are required",
      });
    }

    const draft = await CodeDraft.findOne({ userId, language });

    return res.status(200).json({
      success: true,
      code: draft?.code || "",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Draft fetch failed",
      error: error.message,
    });
  }
};
