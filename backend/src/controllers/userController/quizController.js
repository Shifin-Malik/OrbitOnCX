import mongoose from "mongoose";

import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";
import QuizAttempt from "../../models/QuizAttempt.js";
import User from "../../models/UserModel.js";

const ALLOWED_DIFFICULTIES = new Set(["Easy", "Medium", "Advanced", "Mixed"]);
const ARENA_QUESTION_COUNT = 10;

const getWeightedPlan = (difficulty) => {
  if (difficulty === "Easy") return { Easy: 6, Medium: 3, Advanced: 1 };
  if (difficulty === "Medium") return { Medium: 6, Easy: 2, Advanced: 2 };
  if (difficulty === "Advanced") return { Advanced: 6, Medium: 3, Easy: 1 };
  return null;
};

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const computeRank = (percentage) => {
  if (percentage >= 90) return "LEGEND";
  if (percentage >= 70) return "ACE";
  if (percentage >= 50) return "PRO";
  if (percentage >= 35) return "NOVICE";
  return "FAILED";
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ isActive: true })
      .select("title category difficulty totalQuestions thumbnail")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllQuizzes = getQuizzes;

export const getQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    const quiz = await Quiz.findOne({ _id: id, isActive: true }).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    return res.status(200).json({ success: true, data: quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const startQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    const requestedDifficulty = req.query.difficulty || "Mixed";
    if (!ALLOWED_DIFFICULTIES.has(requestedDifficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty. Use Easy, Medium, Advanced, or Mixed.",
      });
    }

    const quiz = await Quiz.findOne({ _id: quizId, isActive: true }).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const attemptCount = await QuizAttempt.countDocuments({
      userId: req.user._id,
      quizId,
      status: { $in: ["IN_PROGRESS", "COMPLETED"] },
    });

    if (attemptCount >= 3) {
      return res.status(403).json({
        success: false,
        message: "Max attempts reached.",
      });
    }

    const questionCountInQuiz = parsePositiveInt(quiz.totalQuestions) || 0;
    if (questionCountInQuiz < 1) {
      return res.status(400).json({
        success: false,
        message: "No questions available for this quiz yet.",
      });
    }

    const quizObjectId = new mongoose.Types.ObjectId(quizId);
    const weightedPlan = getWeightedPlan(requestedDifficulty);

    let questions = [];

    if (!weightedPlan) {
      questions = await Question.aggregate([
        { $match: { quizId: quizObjectId } },
        { $sample: { size: ARENA_QUESTION_COUNT } },
        { $project: { q: 1, options: 1, difficulty: 1, correctAnswer: 1 } },
      ]);
    } else {
      const facets = {};
      for (const [difficulty, size] of Object.entries(weightedPlan)) {
        facets[difficulty] = [
          { $match: { difficulty } },
          { $sample: { size } },
          { $project: { q: 1, options: 1, difficulty: 1, correctAnswer: 1 } },
        ];
      }

      const [facetResult] = await Question.aggregate([
        { $match: { quizId: quizObjectId } },
        { $facet: facets },
      ]);

      const missingBuckets = [];
      for (const [difficulty, size] of Object.entries(weightedPlan)) {
        const arr = facetResult?.[difficulty] || [];
        if (arr.length !== size) {
          missingBuckets.push(`${difficulty} (${arr.length}/${size})`);
        }
      }

      if (missingBuckets.length) {
        return res.status(400).json({
          success: false,
          message: `Not enough questions per difficulty to start. Missing: ${missingBuckets.join(
            ", ",
          )}.`,
        });
      }

      questions = Object.values(facetResult).flat();
    }

    if (questions.length !== ARENA_QUESTION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Not enough questions to start. Need exactly ${ARENA_QUESTION_COUNT} questions.`,
      });
    }

    // Shuffle for fairness
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    const attempt = await QuizAttempt.create({
      userId: req.user._id,
      quizId,
      status: "IN_PROGRESS",
    });

    const customTimeLimit =
      parsePositiveInt(req.query.customTimeLimit) ??
      parsePositiveInt(req.query.timeLimit) ??
      quiz.timeLimit;

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      quizId: quiz._id,
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      selectedDifficulty: requestedDifficulty,
      distribution: weightedPlan || { Mixed: ARENA_QUESTION_COUNT },
      customTimeLimit,
      totalQuestions: ARENA_QUESTION_COUNT,
      data: questions,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const quizId = req.params.quizId || req.query.quizId || null;

    // Global leaderboard (no quizId): sum XP across all completed missions
    if (!quizId) {
      const entries = await QuizAttempt.aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: "$userId",
            totalXp: { $sum: "$xpGained" },
            missions: { $sum: 1 },
            lastCompletedAt: { $max: "$completedAt" },
          },
        },
        { $sort: { totalXp: -1, missions: -1, lastCompletedAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            user: { _id: "$user._id", name: "$user.name", avatar: "$user.avatar" },
            totalXp: 1,
            missions: 1,
            lastCompletedAt: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        mode: "GLOBAL",
        count: entries.length,
        data: entries,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    const quizObjectId = new mongoose.Types.ObjectId(quizId);

    const entries = await QuizAttempt.aggregate([
      { $match: { quizId: quizObjectId, status: "COMPLETED" } },
      { $sort: { score: -1, timeTaken: 1, completedAt: -1, createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          bestAttemptId: { $first: "$_id" },
          score: { $first: "$score" },
          rank: { $first: "$rank" },
          xpGained: { $first: "$xpGained" },
          correctAnswers: { $first: "$correctAnswers" },
          wrongAnswers: { $first: "$wrongAnswers" },
          timeTaken: { $first: "$timeTaken" },
          completedAt: { $first: "$completedAt" },
        },
      },
      { $sort: { score: -1, timeTaken: 1, completedAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$bestAttemptId",
          user: { _id: "$user._id", name: "$user.name", avatar: "$user.avatar" },
          score: 1,
          rank: 1,
          xpGained: 1,
          correctAnswers: 1,
          wrongAnswers: 1,
          timeTaken: 1,
          completedAt: 1,
        },
      },
    ]);

    const quiz = await Quiz.findById(quizId).select("title").lean();

    return res.status(200).json({
      success: true,
      mode: "QUIZ",
      quizId,
      quizTitle: quiz?.title,
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { quizId, userAnswers, timeTaken } = req.body || {};

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    if (!Array.isArray(userAnswers) || userAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "userAnswers must be a non-empty array.",
      });
    }

    if (userAnswers.length !== ARENA_QUESTION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Exactly ${ARENA_QUESTION_COUNT} answers must be submitted.`,
      });
    }

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const questionIds = userAnswers
      .map((a) => a?.questionId)
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (questionIds.length !== userAnswers.length) {
      return res.status(400).json({
        success: false,
        message: "Each answer must include a valid questionId.",
      });
    }

    const questions = await Question.find({
      _id: { $in: questionIds },
      quizId,
    })
      .select("options correctAnswer")
      .lean();

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more questions are invalid for this quiz.",
      });
    }

    const questionById = new Map(questions.map((q) => [String(q._id), q]));

    const answerResults = userAnswers.map((answer) => {
      const question = questionById.get(String(answer.questionId));
      const selectedOptionText =
        answer?.selectedOptionText ?? answer?.selectedOption ?? null;

      const selectedOptionIndex =
        selectedOptionText === null
          ? null
          : question.options.indexOf(selectedOptionText);

      const isCorrect =
        selectedOptionText !== null && selectedOptionText === question.correctAnswer;

      return {
        questionId: answer.questionId,
        selectedOption: selectedOptionIndex !== -1 ? selectedOptionIndex : null,
        selectedOptionText: selectedOptionText,
        isCorrect,
      };
    });

    const total = answerResults.length;
    const correctAnswers = answerResults.reduce(
      (sum, a) => sum + (a.isCorrect ? 1 : 0),
      0,
    );
    const wrongAnswers = total - correctAnswers;
    const percentage = total ? (correctAnswers / total) * 100 : 0;
    const rank = computeRank(percentage);
    const score = Math.round(percentage);
    const xpGained = Math.round((quiz.xpPotential || 0) * (percentage / 100));

    const safeTimeTaken = parsePositiveInt(timeTaken);

    let attempt = await QuizAttempt.findOne({
      userId: req.user._id,
      quizId,
      status: "IN_PROGRESS",
    }).sort({ createdAt: -1 });

    if (!attempt) {
      attempt = await QuizAttempt.create({
        userId: req.user._id,
        quizId,
        status: "IN_PROGRESS",
      });
    }

    attempt.score = score;
    attempt.correctAnswers = correctAnswers;
    attempt.wrongAnswers = wrongAnswers;
    attempt.xpGained = xpGained;
    attempt.rank = rank;
    attempt.status = "COMPLETED";
    attempt.completedAt = new Date();
    attempt.timeTaken =
      safeTimeTaken ??
      Math.max(0, Math.round((Date.now() - attempt.createdAt.getTime()) / 1000));
    attempt.answers = answerResults;

    await attempt.save();

    // Global ranking (per quiz): based on each user's best score for that quiz,
    // compared against this user's best score.
    const quizObjectId = new mongoose.Types.ObjectId(quizId);

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const [userBest] = await QuizAttempt.aggregate([
      {
        $match: {
          quizId: quizObjectId,
          userId: userObjectId,
          status: "COMPLETED",
        },
      },
      { $group: { _id: "$userId", maxScore: { $max: "$score" } } },
    ]);

    const userBestScore = userBest?.maxScore ?? score;

    const [rankAgg] = await QuizAttempt.aggregate([
      { $match: { quizId: quizObjectId, status: "COMPLETED" } },
      { $group: { _id: "$userId", maxScore: { $max: "$score" } } },
      {
        $facet: {
          higher: [
            { $match: { maxScore: { $gt: userBestScore } } },
            { $count: "count" },
          ],
          participants: [{ $count: "count" }],
        },
      },
    ]);

    const higherCount = rankAgg?.higher?.[0]?.count ?? 0;
    const totalParticipants = rankAgg?.participants?.[0]?.count ?? 0;
    const globalRank = higherCount + 1;

    if (xpGained > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { quizScore: xpGained, totalXp: xpGained },
        $set: { lastActivity: new Date() },
      });
    }

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      results: {
        score,
        correctAnswers,
        wrongAnswers,
        percentage: Math.round(percentage * 100) / 100,
        xpGained,
        rank,
        globalRank,
        totalParticipants,
        timeTaken: attempt.timeTaken,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    if (String(userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const attempts = await QuizAttempt.find({
      userId,
      status: "COMPLETED",
    })
      .populate("quizId", "title category thumbnail")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: attempts.length,
      data: attempts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found" });
    }

    const isOwner = String(quiz.createdBy) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin/creator only.",
      });
    }

    const updates = {};
    const { difficulty, timeLimit, title, description } = req.body || {};

    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (timeLimit !== undefined) updates.timeLimit = timeLimit;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const updated = await Quiz.findByIdAndUpdate(quizId, updates, {
      new: true,
      runValidators: true,
    }).lean();

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
