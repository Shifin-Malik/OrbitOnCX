import asyncHandler from "express-async-handler";
import Problem, { slugify } from "../../models/ProblemModel.js";
import {
  buildProblemListMatch,
  escapeRegex,
  ensureValidObjectId,
  normalizePagination,
  normalizeProblemPayload,
  parseBoolean,
  resolveProblemSort,
  serializeProblemForAdmin,
  serializeProblemListItemForAdmin,
} from "../../services/adminProblemService.js";

const respondValidationError = (res, errors = []) =>
  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });

const resolveDuplicateField = ({ duplicate, nextTitle, nextSlug }) => {
  if (!duplicate) return null;

  if (nextSlug && duplicate.slug === nextSlug) {
    return {
      field: "slug",
      value: nextSlug,
      message: `Problem slug "${nextSlug}" already exists.`,
    };
  }

  return {
    field: "title",
    value: nextTitle,
    message: `Problem title "${nextTitle}" already exists.`,
  };
};

const findDuplicateProblem = async ({ problemId, title, slug }) => {
  const filters = [];

  const normalizedTitle = String(title || "").trim();
  const normalizedSlug = String(slug || "").trim();

  if (normalizedTitle) {
    filters.push({ titleLower: normalizedTitle.toLowerCase() });
    filters.push({
      title: new RegExp(`^${escapeRegex(normalizedTitle)}$`, "i"),
    });
  }

  if (normalizedSlug) {
    filters.push({ slug: normalizedSlug });
  }

  if (filters.length === 0) return null;

  const match = filters.length === 1 ? filters[0] : { $or: filters };
  if (problemId) {
    match._id = { $ne: problemId };
  }

  const duplicate = await Problem.findOne(match)
    .select("_id title slug")
    .lean();

  if (!duplicate) return null;

  return resolveDuplicateField({
    duplicate,
    nextTitle: normalizedTitle,
    nextSlug: normalizedSlug,
  });
};

const createProblemRecord = async ({ payload, userId }) => {
  const { value, errors } = normalizeProblemPayload(payload, {
    isUpdate: false,
  });
  if (errors.length > 0) {
    return { errors };
  }

  const duplicate = await findDuplicateProblem({
    title: value.title,
    slug: value.slug,
  });

  if (duplicate) {
    return { duplicate };
  }

  const created = await Problem.create({
    ...value,
    createdBy: userId || null,
  });

  return { created };
};

const updateProblemRecord = async ({ problemId, payload }) => {
  ensureValidObjectId(problemId, "problem id");

  const existing = await Problem.findById(problemId).select("+hiddenTestCases");
  if (!existing) {
    const error = new Error("Problem not found");
    error.statusCode = 404;
    throw error;
  }

  const { value, errors } = normalizeProblemPayload(payload, {
    isUpdate: true,
  });
  if (errors.length > 0) {
    return { errors };
  }

  if (Object.keys(value).length === 0) {
    return { errors: ["No valid fields provided for update"] };
  }

  const nextTitle = value.title ?? existing.title;
  const nextSlug =
    value.slug ?? (value.title ? slugify(value.title) : existing.slug);

  const duplicate = await findDuplicateProblem({
    problemId: existing._id,
    title: nextTitle,
    slug: nextSlug,
  });

  if (duplicate) {
    return { duplicate };
  }

  existing.set(value);
  if (value.title && value.slug === undefined) {
    existing.slug = slugify(value.title);
  }

  await existing.save();

  return { updated: existing };
};

const respondDuplicateError = (res, duplicate) =>
  res.status(409).json({
    success: false,
    message: duplicate.message,
    field: duplicate.field,
    value: duplicate.value,
  });

export const createProblem = asyncHandler(async (req, res) => {
  const result = await createProblemRecord({
    payload: req.body,
    userId: req.user?._id,
  });

  if (result.errors) {
    return respondValidationError(res, result.errors);
  }

  if (result.duplicate) {
    return respondDuplicateError(res, result.duplicate);
  }

  const created = result.created;

  return res.status(201).json({
    success: true,
    message: "Problem created successfully",
    data: serializeProblemForAdmin(created, { includeHidden: true }),
  });
});

export const createProblemFromJson = asyncHandler(async (req, res) => {
  const payload = req.body?.problem ?? req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a valid JSON object.",
    });
  }

  const result = await createProblemRecord({
    payload,
    userId: req.user?._id,
  });

  if (result.errors) {
    return respondValidationError(res, result.errors);
  }

  if (result.duplicate) {
    return respondDuplicateError(res, result.duplicate);
  }

  return res.status(201).json({
    success: true,
    message: "Problem created successfully",
    data: serializeProblemForAdmin(result.created, { includeHidden: true }),
  });
});

export const createProblemsFromJsonBulk = asyncHandler(
  async (req, res) => {
    const payload = Array.isArray(req.body) ? req.body : req.body?.problems;

    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain a non-empty array of problems.",
      });
    }

    const seenTitleMap = new Map();
    const seenSlugMap = new Map();
    const failed = [];
    const insertable = [];

    for (let index = 0; index < payload.length; index += 1) {
      const item = payload[index];

      if (!item || typeof item !== "object" || Array.isArray(item)) {
        failed.push({
          index,
          errors: ["Each item must be a valid JSON object."],
        });
        continue;
      }

      const { value, errors } = normalizeProblemPayload(item, {
        isUpdate: false,
      });
      const itemErrors = [...errors];

      const titleKey = String(value.title || "")
        .trim()
        .toLowerCase();
      const slugKey = String(value.slug || "")
        .trim()
        .toLowerCase();

      if (titleKey) {
        if (seenTitleMap.has(titleKey)) {
          itemErrors.push(
            `Duplicate title in payload (same as item index ${seenTitleMap.get(titleKey)}).`,
          );
        } else {
          seenTitleMap.set(titleKey, index);
        }
      }

      if (slugKey) {
        if (seenSlugMap.has(slugKey)) {
          itemErrors.push(
            `Duplicate slug in payload (same as item index ${seenSlugMap.get(slugKey)}).`,
          );
        } else {
          seenSlugMap.set(slugKey, index);
        }
      }

      if (itemErrors.length > 0) {
        failed.push({
          index,
          title: value.title || null,
          slug: value.slug || null,
          errors: itemErrors,
        });
        continue;
      }

      const duplicate = await findDuplicateProblem({
        title: value.title,
        slug: value.slug,
      });

      if (duplicate) {
        failed.push({
          index,
          title: value.title || null,
          slug: value.slug || null,
          errors: [duplicate.message],
        });
        continue;
      }

      insertable.push({ index, value });
    }

    const created = [];
    for (const item of insertable) {
      const createdProblem = await Problem.create({
        ...item.value,
        createdBy: req.user?._id || null,
      });

      created.push({
        index: item.index,
        data: serializeProblemForAdmin(createdProblem, { includeHidden: true }),
      });
    }

    const successCount = created.length;
    const failedCount = failed.length;
    const statusCode = successCount > 0 ? 201 : 400;

    return res.status(statusCode).json({
      success: successCount > 0,
      message:
        successCount > 0
          ? "Bulk JSON import completed."
          : "No problems were imported.",
      summary: {
        total: payload.length,
        successCount,
        failedCount,
      },
      data: created.map((item) => item.data),
      created,
      failed,
    });
  },
);

export const getAdminProblems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = normalizePagination(req.query);
  const match = buildProblemListMatch(req.query);
  const sort = resolveProblemSort(req.query.sort);

  const [problems, total] = await Promise.all([
    Problem.find(match)
      .populate("createdBy", "_id name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Problem.countDocuments(match),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return res.status(200).json({
    success: true,
    message: "Problems fetched successfully",
    data: problems.map((problem) => serializeProblemListItemForAdmin(problem)),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
});

export const getProblemById = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "problem id");

  const problem = await Problem.findById(req.params.id)
    .select("+hiddenTestCases")
    .populate("createdBy", "_id name email");

  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  return res.status(200).json({
    success: true,
    message: "Problem details fetched successfully",
    data: serializeProblemForAdmin(problem, { includeHidden: true }),
  });
});

export const updateProblem = asyncHandler(async (req, res) => {
  const result = await updateProblemRecord({
    problemId: req.params.id,
    payload: req.body,
  });

  if (result.errors) {
    return respondValidationError(res, result.errors);
  }

  if (result.duplicate) {
    return respondDuplicateError(res, result.duplicate);
  }

  return res.status(200).json({
    success: true,
    message: "Problem updated successfully",
    data: serializeProblemForAdmin(result.updated, { includeHidden: true }),
  });
});

export const updateProblemFromJson = asyncHandler(async (req, res) => {
  const payload = req.body?.problem ?? req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a valid JSON object.",
    });
  }

  const result = await updateProblemRecord({
    problemId: req.params.id,
    payload,
  });

  if (result.errors) {
    return respondValidationError(res, result.errors);
  }

  if (result.duplicate) {
    return respondDuplicateError(res, result.duplicate);
  }

  return res.status(200).json({
    success: true,
    message: "Problem updated successfully",
    data: serializeProblemForAdmin(result.updated, { includeHidden: true }),
  });
});

export const deleteProblem = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "problem id");

  const deleted = await Problem.findByIdAndDelete(req.params.id).select(
    "_id title slug",
  );
  if (!deleted) {
    res.status(404);
    throw new Error("Problem not found");
  }

  return res.status(200).json({
    success: true,
    message: "Problem deleted successfully",
    data: {
      _id: deleted._id,
      title: deleted.title,
      slug: deleted.slug,
    },
  });
});

export const toggleProblemStatus = asyncHandler(async (req, res) => {
  ensureValidObjectId(req.params.id, "problem id");

  const problem = await Problem.findById(req.params.id);
  if (!problem) {
    res.status(404);
    throw new Error("Problem not found");
  }

  if (req.body?.isActive === undefined) {
    problem.isActive = !problem.isActive;
  } else {
    problem.isActive = parseBoolean(req.body.isActive, problem.isActive);
  }

  await problem.save();

  return res.status(200).json({
    success: true,
    message: `Problem marked as ${problem.isActive ? "active" : "inactive"}.`,
    data: serializeProblemListItemForAdmin(problem),
  });
});
