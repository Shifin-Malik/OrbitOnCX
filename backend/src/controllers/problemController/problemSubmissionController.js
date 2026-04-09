import asyncHandler from "express-async-handler";
import Problem from "../../models/ProblemModel.js";
import Submission from "../../models/SubmissionModel.js";

export const getMySubmissionsForProblem = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = "1", limit = "20" } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(5, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const problem = await Problem.findOne({ slug, isActive: true }).select("_id slug title").lean();
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  const [total, submissions] = await Promise.all([
    Submission.countDocuments({ user: req.user._id, problem: problem._id }),
    Submission.find({ user: req.user._id, problem: problem._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .select("language status isAccepted runtime memory createdAt failedTestCaseSummary")
      .lean(),
  ]);

  res.status(200).json({
    success: true,
    problem,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.max(1, Math.ceil(total / limitNum)),
    submissions,
  });
});

