import mongoose from "mongoose";
import Quiz from "../../models/QuizModel.js";
import Question from "../../models/QuestionModel.js";
import QuizAttempt from "../../models/QuizAttempt.js";
import User from "../../models/UserModel.js";

const ARENA_QUESTION_COUNT = 10;

const DIFFICULTY_PLANS = {
  Easy: { Easy: 6, Medium: 3, Advanced: 1 },
  Medium: { Medium: 6, Easy: 2, Advanced: 2 },
  Advanced: { Advanced: 6, Medium: 3, Easy: 1 },
};

const QUIZ_LIST_PROJECTION = {
  title: 1,
  category: 1,
  difficulty: 1,
  totalQuestions: 1,
  thumbnail: 1,
};

const QUIZ_DETAILS_PROJECTION = {
  _id: 1,
  title: 1,
  description: 1,
  category: 1,
  difficulty: 1,
  xpPotential: 1,
  timeLimit: 1,
  totalQuestions: 1,
  thumbnail: 1,
  createdAt: 1,
};

const QUIZ_START_PROJECTION = {
  _id: 1,
  title: 1,
  category: 1,
  difficulty: 1,
  timeLimit: 1,
  totalQuestions: 1,
};

const QUESTION_PUBLIC_PROJECTION = {
  _id: 1,
  q: 1,
  options: 1,
  difficulty: 1,
  correctAnswer: 1,
};

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const computeRank = (percentage) => {
  if (percentage >= 90) return "LEGEND";
  if (percentage >= 70) return "ACE";
  if (percentage >= 50) return "PRO";
  if (percentage >= 35) return "NOVICE";
  return "FAILED";
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const getQuizzes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;
    const query = { isActive: true };

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .select(QUIZ_LIST_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quiz.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      count: quizzes.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: quizzes,
    });
  } catch (error) {
    console.error("getQuizzes error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAllQuizzes = getQuizzes;

export const getQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quizId",
      });
    }

    const quiz = await Quiz.findOne(
      { _id: id, isActive: true },
      QUIZ_DETAILS_PROJECTION,
    ).lean();

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error("getQuizDetails error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const startQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user?._id;
    const selectedDifficulty = req.query.difficulty || "Easy";

    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quizId",
      });
    }

    if (!(selectedDifficulty in DIFFICULTY_PLANS)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty. Use Easy, Medium, or Advanced.",
      });
    }

    const quizObjectId = new mongoose.Types.ObjectId(quizId);
    const distribution = DIFFICULTY_PLANS[selectedDifficulty];

    const [quiz, attemptCount] = await Promise.all([
      Quiz.findOne(
        { _id: quizObjectId, isActive: true },
        QUIZ_START_PROJECTION,
      ).lean(),
      QuizAttempt.countDocuments({
        userId,
        quizId: quizObjectId,
        status: { $in: ["IN_PROGRESS", "COMPLETED"] },
      }),
    ]);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found",
      });
    }

    if (attemptCount >= 3) {
      return res.status(403).json({
        success: false,
        message: "Max attempts reached.",
      });
    }

    if ((parsePositiveInt(quiz.totalQuestions) || 0) < ARENA_QUESTION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Need at least ${ARENA_QUESTION_COUNT} questions.`,
      });
    }

    const [aggResult] = await Question.aggregate([
      { $match: { quizId: quizObjectId } },
      {
        $facet: {
          Easy: [
            { $match: { difficulty: "Easy" } },
            { $sample: { size: distribution.Easy } },
            { $project: QUESTION_PUBLIC_PROJECTION },
          ],
          Medium: [
            { $match: { difficulty: "Medium" } },
            { $sample: { size: distribution.Medium } },
            { $project: QUESTION_PUBLIC_PROJECTION },
          ],
          Advanced: [
            { $match: { difficulty: "Advanced" } },
            { $sample: { size: distribution.Advanced } },
            { $project: QUESTION_PUBLIC_PROJECTION },
          ],
        },
      },
    ]);

    const missing = Object.entries(distribution)
      .filter(([level, size]) => (aggResult?.[level] || []).length !== size)
      .map(
        ([level, size]) =>
          `${level} (${(aggResult?.[level] || []).length}/${size})`,
      );

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing: ${missing.join(", ")}`,
      });
    }

    const questions = Object.values(aggResult || {}).flat();

    if (questions.length !== ARENA_QUESTION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Need exactly ${ARENA_QUESTION_COUNT} questions.`,
      });
    }

    const timeLimit =
      parsePositiveInt(req.query.customTimeLimit) ??
      parsePositiveInt(req.query.timeLimit) ??
      parsePositiveInt(quiz.timeLimit) ??
      20;

    const attempt = await QuizAttempt.create({
      userId,
      quizId: quizObjectId,
      status: "IN_PROGRESS",
      selectedDifficulty,
      totalQuestions: ARENA_QUESTION_COUNT,
      timeLimit,
    });

    return res.status(200).json({
      success: true,
      attemptId: attempt._id,
      quizId: quiz._id,
      title: quiz.title,
      category: quiz.category,
      difficulty: quiz.difficulty,
      selectedDifficulty,
      distribution,
      customTimeLimit: timeLimit,
      totalQuestions: ARENA_QUESTION_COUNT,
      data: shuffle(questions),
    });
  } catch (error) {
    console.error("startQuiz error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const GLOBAL_LEADERBOARD_PIPELINE = [
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
      pipeline: [{ $project: { _id: 1, name: 1, avatar: 1 } }],
      as: "user",
    },
  },
  { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      user: 1,
      totalXp: 1,
      missions: 1,
      lastCompletedAt: 1,
    },
  },
];

export const getLeaderboard = async (req, res) => {
  try {
    const data = await QuizAttempt.aggregate(GLOBAL_LEADERBOARD_PIPELINE);

    return res.status(200).json({
      success: true,
      mode: "GLOBAL",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getLeaderboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const submitQuiz = async (req, res) => {
  try {
    const { quizId, userAnswers, timeTaken } = req.body || {};
    const userId = req.user?._id;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid quizId" });
    }

    if (!Array.isArray(userAnswers) || userAnswers.length !== ARENA_QUESTION_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Exactly ${ARENA_QUESTION_COUNT} answers must be submitted.`,
      });
    }

    const quizObjectId = new mongoose.Types.ObjectId(quizId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    
    const userAnswerDocs = userAnswers.map((a) => ({
      questionId: new mongoose.Types.ObjectId(a?.questionId),
      selectedOptionText: a?.selectedOptionText ?? a?.selectedOption ?? null,
    }));

    const [quizResult, inProgressAttempt] = await Promise.all([
      Quiz.aggregate([
      
        { $match: { _id: quizObjectId } },
        { $project: { _id: 1, xpPotential: 1 } },

  
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "quizId",
            pipeline: [{ $project: { _id: 1, correctAnswer: 1, options: 1 } }],
            as: "questions",
          },
        },

        {
          $match: {
            [`questions.${ARENA_QUESTION_COUNT - 1}`]: { $exists: true },
          },
        },

       
        {
          $addFields: {
            userAnswers: userAnswerDocs,
            answers: {
              $map: {
                input: "$questions",
                as: "q",
                in: {
                  questionId: "$$q._id",
                  correctAnswer: "$$q.correctAnswer",
                  selectedOptionText: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: userAnswerDocs,
                              as: "ua",
                              cond: { $eq: ["$$ua.questionId", "$$q._id"] },
                            },
                          },
                        },
                      },
                      in: "$$matched.selectedOptionText",
                    },
                  },
                  isCorrect: {
                    $let: {
                      vars: {
                        matched: {
                          $first: {
                            $filter: {
                              input: userAnswerDocs,
                              as: "ua",
                              cond: { $eq: ["$$ua.questionId", "$$q._id"] },
                            },
                          },
                        },
                      },
                      in: {
                        $and: [
                          { $ne: ["$$matched.selectedOptionText", null] },
                          { $eq: ["$$matched.selectedOptionText", "$$q.correctAnswer"] },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },

        
        {
          $addFields: {
            correctAnswers: {
              $size: {
                $filter: {
                  input: "$answers",
                  as: "a",
                  cond: { $eq: ["$$a.isCorrect", true] },
                },
              },
            },
          },
        },

       
        {
          $addFields: {
            percentage: {
              $multiply: [
                { $divide: ["$correctAnswers", ARENA_QUESTION_COUNT] },
                100,
              ],
            },
          },
        },
        {
          $addFields: {
            score: { $round: ["$percentage", 0] },
            xpGained: {
              $round: [
                {
                  $multiply: [
                    { $ifNull: ["$xpPotential", 0] },
                    { $divide: ["$percentage", 100] },
                  ],
                },
                0,
              ],
            },
          },
        },

        
        {
          $addFields: {
            answers: {
              $map: {
                input: "$answers",
                as: "a",
                in: {
                  questionId: "$$a.questionId",
                  selectedOptionText: "$$a.selectedOptionText",
                  isCorrect: "$$a.isCorrect",
                },
              },
            },
          },
        },

        {
          $project: {
            _id: 1,
            xpPotential: 1,
            correctAnswers: 1,
            percentage: 1,
            score: 1,
            xpGained: 1,
            answers: 1,
          },
        },
      ]),

      QuizAttempt.findOne({
        userId: userObjectId,
        quizId: quizObjectId,
        status: "IN_PROGRESS",
      })
        .sort({ createdAt: -1 })
        .select("_id createdAt")
        .lean(),
    ]);

    if (!quizResult?.length) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found or question count mismatch.",
      });
    }

    const {
      correctAnswers,
      percentage,
      score,
      xpGained,
      answers,
    } = quizResult[0];

    const wrongAnswers = ARENA_QUESTION_COUNT - correctAnswers;
    const rank = computeRank(percentage);

    const completedAt = new Date();
    const safeTimeTaken = parsePositiveInt(timeTaken);
    const finalTimeTaken =
      safeTimeTaken ??
      Math.max(
        0,
        Math.round(
          (Date.now() - new Date(inProgressAttempt?.createdAt || completedAt).getTime()) / 1000
        )
      );

    const attemptPayload = {
      score,
      correctAnswers,
      wrongAnswers,
      xpGained,
      rank,
      status: "COMPLETED",
      completedAt,
      timeTaken: finalTimeTaken,
      answers,
    };

    // --- Attempt save, rank agg, XP update — parallel ---
    const [attempt, rankAggResult] = await Promise.all([
      inProgressAttempt
        ? QuizAttempt.findByIdAndUpdate(
            inProgressAttempt._id,
            { $set: attemptPayload },
            { new: true }
          ).lean()
        : QuizAttempt.create({
            userId: userObjectId,
            quizId: quizObjectId,
            ...attemptPayload,
          }),

      QuizAttempt.aggregate([
        { $match: { quizId: quizObjectId, status: "COMPLETED" } },
        { $group: { _id: "$userId", bestScore: { $max: "$score" } } },
        {
          $facet: {
            higher: [{ $match: { bestScore: { $gt: score } } }, { $count: "count" }],
            participants: [{ $count: "count" }],
          },
        },
      ]),

      xpGained > 0
        ? User.updateOne(
            { _id: userObjectId },
            {
              $inc: { quizScore: xpGained, totalXp: xpGained },
              $set: { lastActivity: completedAt },
            }
          )
        : Promise.resolve(),
    ]);

    const higherCount = rankAggResult?.[0]?.higher?.[0]?.count ?? 0;
    const totalParticipants = rankAggResult?.[0]?.participants?.[0]?.count ?? 0;
    const globalRank = higherCount + 1;

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
        timeTaken: finalTimeTaken,
        answers,
      },
    });
  } catch (error) {
    console.error("submitQuiz error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUserHistory = async (req, res) => {
  try {
    const userId = req.query.userId || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    if (String(userId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const data = await QuizAttempt.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          status: "COMPLETED",
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "quizzes",
          localField: "quizId",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, title: 1, category: 1, thumbnail: 1 } },
          ],
          as: "quiz",
        },
      },
      { $unwind: { path: "$quiz", preserveNullAndEmptyArrays: true } },
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getUserHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
