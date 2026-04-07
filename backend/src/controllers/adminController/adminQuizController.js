import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";

export const createQuiz = async (req, res) => {
  try {
    const quizData = { ...req.body };
    
    if (req.file) {
      quizData.thumbnail = req.file.path;
    }

    const newQuiz = await Quiz.create({
      ...quizData,
      createdBy: req.user._id 
    });

    res.status(201).json({ success: true, data: newQuiz });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: quizzes.length, data: quizzes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: "Invalid ID" });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    await Question.deleteMany({ quizId: quiz._id });
    await quiz.deleteOne();

    res
      .status(200)
      .json({
        success: true,
        message: "Quiz and its questions deleted successfully",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
