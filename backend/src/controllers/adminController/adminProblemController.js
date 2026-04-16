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
import {
  parseProblemsFromPdfBuffer,
  validateParsedProblemShape,
} from "../../services/problemPdfImportService.js";

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

const normalizeImportMode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase() === "publish"
    ? "publish"
    : "draft";

const buildNormalizedTitleKey = (title) =>
  slugify(String(title || "").trim().toLowerCase());

const normalizeImportProblemPayload = (problem, { mode = "draft" } = {}) => {
  const merged = {
    ...problem,
    isActive: mode === "publish",
  };

  return normalizeProblemPayload(merged, { isUpdate: false });
};

const buildCandidateKeyData = (value = {}) => {
  const title = String(value.title || "").trim();
  const slug = String(value.slug || "").trim();
  const titleLower = title.toLowerCase();
  const slugLower = slug.toLowerCase();
  const normalizedTitleKey = buildNormalizedTitleKey(title);

  return {
    title,
    slug,
    titleLower,
    slugLower,
    normalizedTitleKey,
  };
};

const buildPayloadDuplicateMap = (candidates = []) => {
  const seenTitleMap = new Map();
  const seenSlugMap = new Map();
  const seenNormalizedTitleMap = new Map();
  const duplicateMap = new Map();

  candidates.forEach((candidate) => {
    const { index, keyData } = candidate;
    const reasons = [];

    if (keyData.titleLower) {
      if (seenTitleMap.has(keyData.titleLower)) {
        reasons.push(
          `Duplicate title in import payload (same as item index ${seenTitleMap.get(keyData.titleLower)}).`,
        );
      } else {
        seenTitleMap.set(keyData.titleLower, index);
      }
    }

    if (keyData.slugLower) {
      if (seenSlugMap.has(keyData.slugLower)) {
        reasons.push(
          `Duplicate slug in import payload (same as item index ${seenSlugMap.get(keyData.slugLower)}).`,
        );
      } else {
        seenSlugMap.set(keyData.slugLower, index);
      }
    }

    if (keyData.normalizedTitleKey) {
      if (seenNormalizedTitleMap.has(keyData.normalizedTitleKey)) {
        reasons.push(
          `Duplicate normalized title in import payload (same as item index ${seenNormalizedTitleMap.get(keyData.normalizedTitleKey)}).`,
        );
      } else {
        seenNormalizedTitleMap.set(keyData.normalizedTitleKey, index);
      }
    }

    if (reasons.length > 0) {
      duplicateMap.set(index, reasons);
    }
  });

  return duplicateMap;
};

const findDatabaseDuplicatesForCandidates = async (candidates = []) => {
  const titleLowerSet = new Set();
  const slugSet = new Set();

  candidates.forEach(({ keyData }) => {
    if (keyData.titleLower) titleLowerSet.add(keyData.titleLower);
    if (keyData.slugLower) slugSet.add(keyData.slugLower);
  });

  const filters = [];
  const titleLowers = [...titleLowerSet];
  const slugs = [...slugSet];

  if (titleLowers.length > 0) {
    filters.push({ titleLower: { $in: titleLowers } });
  }
  if (slugs.length > 0) {
    filters.push({ slug: { $in: slugs } });
  }

  if (filters.length === 0) {
    return {
      byTitleLower: new Map(),
      bySlugLower: new Map(),
      byNormalizedTitle: new Map(),
    };
  }

  const existing = await Problem.find(filters.length === 1 ? filters[0] : { $or: filters })
    .select("_id title titleLower slug")
    .lean();

  const byTitleLower = new Map();
  const bySlugLower = new Map();
  const byNormalizedTitle = new Map();

  existing.forEach((doc) => {
    const titleLower = String(doc.titleLower || "").toLowerCase();
    const slugLower = String(doc.slug || "").toLowerCase();
    const normalizedTitleKey = buildNormalizedTitleKey(doc.title);

    if (titleLower && !byTitleLower.has(titleLower)) {
      byTitleLower.set(titleLower, doc);
    }
    if (slugLower && !bySlugLower.has(slugLower)) {
      bySlugLower.set(slugLower, doc);
    }
    if (normalizedTitleKey && !byNormalizedTitle.has(normalizedTitleKey)) {
      byNormalizedTitle.set(normalizedTitleKey, doc);
    }
  });

  return {
    byTitleLower,
    bySlugLower,
    byNormalizedTitle,
  };
};

const evaluateImportProblems = async (rawProblems = [], { mode = "draft" } = {}) => {
  const prepared = rawProblems.map((problem, index) => {
    const shapeErrors = validateParsedProblemShape(problem);
    const normalizedResult = normalizeImportProblemPayload(problem, { mode });
    const normalizedErrors = normalizedResult.errors || [];

    const allErrors = [...shapeErrors, ...normalizedErrors];
    const keyData = buildCandidateKeyData(normalizedResult.value || {});

    return {
      index,
      original: problem,
      value: normalizedResult.value || {},
      keyData,
      errors: allErrors,
    };
  });

  const validCandidates = prepared.filter((candidate) => candidate.errors.length === 0);
  const payloadDuplicateMap = buildPayloadDuplicateMap(validCandidates);
  const dbDuplicates = await findDatabaseDuplicatesForCandidates(validCandidates);

  const evaluation = prepared.map((candidate) => {
    const issues = [...candidate.errors];
    const payloadDuplicateIssues = payloadDuplicateMap.get(candidate.index) || [];
    issues.push(...payloadDuplicateIssues);

    let duplicateField = "";
    let duplicateValue = "";
    let duplicateProblemId = null;
    let duplicateTitle = "";
    let duplicateSlug = "";

    if (issues.length === 0) {
      const { titleLower, slugLower, normalizedTitleKey } = candidate.keyData;
      let duplicateDoc = null;

      if (slugLower && dbDuplicates.bySlugLower.has(slugLower)) {
        duplicateDoc = dbDuplicates.bySlugLower.get(slugLower);
        duplicateField = "slug";
        duplicateValue = candidate.value.slug;
      } else if (titleLower && dbDuplicates.byTitleLower.has(titleLower)) {
        duplicateDoc = dbDuplicates.byTitleLower.get(titleLower);
        duplicateField = "title";
        duplicateValue = candidate.value.title;
      } else if (
        normalizedTitleKey &&
        dbDuplicates.byNormalizedTitle.has(normalizedTitleKey)
      ) {
        duplicateDoc = dbDuplicates.byNormalizedTitle.get(normalizedTitleKey);
        duplicateField = "normalizedTitle";
        duplicateValue = candidate.value.title;
      }

      if (duplicateDoc) {
        duplicateProblemId = duplicateDoc._id || null;
        duplicateTitle = duplicateDoc.title || "";
        duplicateSlug = duplicateDoc.slug || "";
        issues.push(
          duplicateField === "slug"
            ? `Problem slug "${candidate.value.slug}" already exists.`
            : `Problem title "${candidate.value.title}" already exists.`,
        );
      }
    }

    let status = "ready";
    if (issues.length > 0) {
      status =
        duplicateField || payloadDuplicateIssues.length > 0
          ? "duplicate"
          : "invalid";
    }

    return {
      index: candidate.index,
      title: candidate.value.title || candidate.original?.title || "",
      slug: candidate.value.slug || "",
      status,
      errors: issues,
      duplicateField: duplicateField || null,
      duplicateValue: duplicateValue || null,
      duplicateProblemId,
      duplicateTitle: duplicateTitle || null,
      duplicateSlug: duplicateSlug || null,
      normalizedPayload: candidate.value,
    };
  });

  const summary = {
    totalParsed: rawProblems.length,
    valid: evaluation.filter((item) => item.status === "ready").length,
    duplicates: evaluation.filter((item) => item.status === "duplicate").length,
    invalid: evaluation.filter((item) => item.status === "invalid").length,
  };

  return {
    evaluation,
    summary,
  };
};

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

export const previewProblemPdfImport = asyncHandler(async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({
      success: false,
      message: "PDF file is required.",
    });
  }

  let parsed = null;
  try {
    parsed = await parseProblemsFromPdfBuffer(req.file.buffer);
  } catch (error) {
    return res.status(422).json({
      success: false,
      message: error?.message || "Failed to extract readable text from uploaded PDF.",
    });
  }

  const problems = Array.isArray(parsed?.problems) ? parsed.problems : [];
  if (problems.length === 0) {
    return res.status(422).json({
      success: false,
      message: "No coding problems could be parsed from this PDF.",
      data: {
        problems: [],
        evaluation: [],
        summary: {
          totalParsed: 0,
          valid: 0,
          duplicates: 0,
          invalid: 0,
        },
      },
    });
  }

  const evaluated = await evaluateImportProblems(problems, { mode: "draft" });

  const evaluation = evaluated.evaluation.map((item) => ({
    index: item.index,
    title: item.title,
    slug: item.slug,
    status: item.status,
    errors: item.errors,
    duplicateField: item.duplicateField,
    duplicateValue: item.duplicateValue,
    duplicateProblemId: item.duplicateProblemId,
  }));

  return res.status(200).json({
    success: true,
    message: "PDF parsed successfully",
    data: {
      problems,
      evaluation,
      summary: evaluated.summary,
    },
  });
});

export const saveProblemPdfImport = asyncHandler(async (req, res) => {
  const mode = normalizeImportMode(req.body?.mode);
  const rawProblems = Array.isArray(req.body)
    ? req.body
    : Array.isArray(req.body?.problems)
      ? req.body.problems
      : [];

  if (rawProblems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Request body must contain a non-empty problems array.",
    });
  }

  const evaluated = await evaluateImportProblems(rawProblems, { mode });
  const readyItems = evaluated.evaluation.filter((item) => item.status === "ready");
  const skipped = evaluated.evaluation
    .filter((item) => item.status !== "ready")
    .map((item) => ({
      index: item.index,
      title: item.title || null,
      slug: item.slug || null,
      status: item.status,
      errors: item.errors,
    }));

  const created = [];
  for (const item of readyItems) {
    const createdProblem = await Problem.create({
      ...item.normalizedPayload,
      isActive: mode === "publish",
      createdBy: req.user?._id || null,
    });
    created.push(serializeProblemForAdmin(createdProblem, { includeHidden: true }));
  }

  const inserted = created.length;
  const duplicates = evaluated.summary.duplicates;
  const invalid = evaluated.summary.invalid;
  const statusCode = inserted > 0 ? 201 : 400;

  return res.status(statusCode).json({
    success: inserted > 0,
    message:
      inserted > 0
        ? "Problem PDF import completed."
        : "No problems were imported from the provided payload.",
    data: {
      created,
      skipped,
      summary: {
        requested: rawProblems.length,
        inserted,
        duplicates,
        invalid,
        mode,
      },
    },
  });
});

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
