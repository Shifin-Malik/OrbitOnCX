import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Problem from "../../models/ProblemModel.js";

const parseCsv = (value) => {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const listProblems = asyncHandler(async (req, res) => {
  const {
    search = "",
    difficulty,
    tags,
    status,
    sort = "newest",
    page = "1",
    limit = "20",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(5, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const match = { isActive: true };
  const trimmedSearch = typeof search === "string" ? search.trim() : "";
  if (trimmedSearch) {
    const safe = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.title = { $regex: safe, $options: "i" };
  }
  if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
    match.difficulty = difficulty;
  }

  const tagList = parseCsv(tags);
  if (tagList.length) {
    match.tags = { $in: tagList };
  }

  const userId = req.user?._id ? new mongoose.Types.ObjectId(req.user._id) : null;

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: "submissions",
        let: { problemId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$problem", "$$problemId"] },
                  { $eq: ["$user", userId] },
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              hasAnySubmission: { $sum: 1 },
              hasAccepted: {
                $max: {
                  $cond: [{ $eq: ["$isAccepted", true] }, 1, 0],
                },
              },
            },
          },
        ],
        as: "mySubmissionMeta",
      },
    },
    {
      $addFields: {
        hasAnySubmission: {
          $gt: [{ $ifNull: [{ $arrayElemAt: ["$mySubmissionMeta.hasAnySubmission", 0] }, 0] }, 0],
        },
        hasAccepted: {
          $gt: [{ $ifNull: [{ $arrayElemAt: ["$mySubmissionMeta.hasAccepted", 0] }, 0] }, 0],
        },
      },
    },
    {
      $addFields: {
        solveStatus: {
          $cond: [
            "$hasAccepted",
            "solved",
            {
              $cond: ["$hasAnySubmission", "attempted", "unsolved"],
            },
          ],
        },
        acceptanceRate: {
          $cond: [
            { $gt: ["$submissionCount", 0] },
            {
              $multiply: [
                { $divide: ["$acceptanceCount", "$submissionCount"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        mySubmissionMeta: 0,
        visibleTestCases: 0,
        starterCode: 0,
        description: 0,
        constraints: 0,
        examples: 0,
        hints: 0,
      },
    },
  ];

  if (status && ["solved", "attempted", "unsolved"].includes(status)) {
    pipeline.push({ $match: { solveStatus: status } });
  }

  if (sort === "title") pipeline.push({ $sort: { title: 1 } });
  else if (sort === "difficulty") {
    pipeline.push({
      $addFields: {
        difficultyOrder: {
          $switch: {
            branches: [
              { case: { $eq: ["$difficulty", "Easy"] }, then: 1 },
              { case: { $eq: ["$difficulty", "Medium"] }, then: 2 },
              { case: { $eq: ["$difficulty", "Hard"] }, then: 3 },
            ],
            default: 9,
          },
        },
      },
    });
    pipeline.push({ $sort: { difficultyOrder: 1, title: 1 } });
    pipeline.push({ $project: { difficultyOrder: 0 } });
  } else if (sort === "most-solved") {
    pipeline.push({ $sort: { acceptanceCount: -1, submissionCount: -1 } });
  } else pipeline.push({ $sort: { createdAt: -1 } });

  pipeline.push({
    $facet: {
      meta: [{ $count: "total" }],
      data: [{ $skip: skip }, { $limit: limitNum }],
    },
  });

  const agg = await Problem.aggregate(pipeline);
  const total = agg?.[0]?.meta?.[0]?.total || 0;
  const problems = agg?.[0]?.data || [];

  res.status(200).json({
    success: true,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
    problems,
  });
});

export const getProblemBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const problem = await Problem.findOne({ slug, isActive: true }).lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  res.status(200).json({ success: true, problem });
});
