import Question from "../../models/QuestionModel.js";
import mongoose from "mongoose";
export const bulkAddQuestions = async (req, res) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of questions.",
      });
    }

    const createdQuestions = await Question.insertMany(questions);

    const quizId = questions[0].quizId;
    await mongoose.model("Quiz").findByIdAndUpdate(quizId, {
      $inc: { totalQuestions: questions.length },
    });

    res.status(201).json({
      success: true,
      count: createdQuestions.length,
      data: createdQuestions,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const getQuestionsByQuiz = async (req, res) => {
  try {
    const questions = await Question.find({ quizId: req.params.quizId });
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!question) return res.status(404).json({ message: "Question not found" });
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: "Question not found" });

    await question.deleteOne(); 
    res.status(200).json({ success: true, message: "Question removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};