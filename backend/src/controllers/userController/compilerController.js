import axios from "axios";
import CodeExecution from "../../models/CodeExecution.js";

export const executeCode = async (req, res) => {
  const { language, code, userId } = req.body;

  // പുതിയ ലാംഗ്വേജ് ഐഡികൾ ഇവിടെ ചേർത്തു
  const languageIds = {
    javascript: 63,
    python: 71,
    java: 62,
    cpp: 54,
    c: 50, // C (GCC 9.2.0)
    go: 60, // Go (1.13.5)
    rust: 73, // Rust (1.40.0)
    php: 68, // PHP (7.4.1)
  };

  const langId = languageIds[language];

  if (!langId || !code) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Language or Code" });
  }

  try {
    // Judge0 Public API Endpoint
    const judge0Url = "https://ce.judge0.com";

    const response = await axios.post(
      `${judge0Url}/submissions?base64_encoded=false&wait=true`,
      {
        language_id: langId,
        source_code: code,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = response.data;

    // ഔട്ട്പുട്ട് പ്രോസസ്സിംഗ്
    // stdout: നോർമൽ ഔട്ട്പുട്ട്
    // stderr: റൺടൈം എറർ
    // compile_output: കംപൈലേഷൻ എറർ (C, C++, Java, Rust എന്നിവയ്ക്ക് ഇത് വരാം)
    const finalOutput =
      result.stdout || result.stderr || result.compile_output || "No output";

    const isSuccess = result.status?.id === 3; // status 3 എന്നാൽ 'Accepted'

    // ഡാറ്റാബേസിൽ സേവ് ചെയ്യുന്നു
    if (userId) {
      try {
        await CodeExecution.create({
          userId,
          language,
          code,
          output: finalOutput,
          status: isSuccess ? "Success" : "Error",
        });
      } catch (dbError) {
        console.error("Database Save Error:", dbError.message);
        // DB സേവ് പരാജയപ്പെട്ടാലും യൂസർക്ക് റിസൾട്ട് നൽകുന്നത് തടയേണ്ടതില്ല
      }
    }

    res.status(200).json({
      success: true,
      output: finalOutput,
      time: result.time,
      memory: result.memory,
      status: result.status?.description, // 'Accepted', 'Wrong Answer' etc.
    });
  } catch (error) {
    console.error(
      "Judge0 Error Detail:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      success: false,
      message: "Compiler backend is busy or down.",
      error: error.message,
    });
  }
};
