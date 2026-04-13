export const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

export const slugifyProblemTitle = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const asString = (value) => String(value ?? "");

const ensureStringList = (value) => {
  if (!Array.isArray(value)) return [""];
  const list = value.map((item) => asString(item));
  return list.length > 0 ? list : [""];
};

const ensureExamples = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ input: "", output: "", explanation: "" }];
  }

  return value.map((item) => ({
    input: asString(item?.input),
    output: asString(item?.output ?? item?.expectedOutput),
    explanation: asString(item?.explanation),
  }));
};

const ensureVisibleTestCases = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ input: "", output: "", explanation: "" }];
  }

  return value.map((item) => ({
    input: asString(item?.input),
    output: asString(item?.output ?? item?.expectedOutput),
    explanation: asString(item?.explanation),
  }));
};

const ensureHiddenTestCases = (value) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ input: "", output: "" }];
  }

  return value.map((item) => ({
    input: asString(item?.input),
    output: asString(item?.output ?? item?.expectedOutput),
  }));
};

const ensureCodeBundle = (value) => ({
  javascript: asString(value?.javascript),
  python: asString(value?.python),
  java: asString(value?.java),
  cpp: asString(value?.cpp),
});

export const createEmptyProblemForm = () => ({
  title: "",
  slug: "",
  description: "",
  difficulty: "Easy",
  tags: [""],
  constraints: [""],
  hints: [""],
  examples: [{ input: "", output: "", explanation: "" }],
  visibleTestCases: [{ input: "", output: "", explanation: "" }],
  hiddenTestCases: [{ input: "", output: "" }],
  starterCode: {
    javascript: "",
    python: "",
    java: "",
    cpp: "",
  },
  referenceSolution: {
    javascript: "",
    python: "",
    java: "",
    cpp: "",
  },
  isActive: true,
});

export const normalizeProblemForForm = (problem) => {
  if (!problem) return createEmptyProblemForm();

  return {
    title: asString(problem.title),
    slug: asString(problem.slug || slugifyProblemTitle(problem.title || "")),
    description: asString(problem.description),
    difficulty: DIFFICULTY_OPTIONS.includes(problem.difficulty)
      ? problem.difficulty
      : "Easy",
    tags: ensureStringList(problem.tags),
    constraints: ensureStringList(problem.constraints),
    hints: ensureStringList(problem.hints),
    examples: ensureExamples(problem.examples),
    visibleTestCases: ensureVisibleTestCases(problem.visibleTestCases),
    hiddenTestCases: ensureHiddenTestCases(problem.hiddenTestCases),
    starterCode: ensureCodeBundle(problem.starterCode),
    referenceSolution: ensureCodeBundle(problem.referenceSolution),
    isActive: Boolean(problem.isActive ?? true),
  };
};

const cleanStringList = (list = []) =>
  list
    .map((item) => asString(item).trim())
    .filter(Boolean);

const cleanExamples = (examples = []) =>
  examples
    .map((item) => ({
      input: asString(item?.input),
      output: asString(item?.output),
      explanation: asString(item?.explanation),
    }))
    .filter((item) => item.input || item.output || item.explanation);

const cleanVisibleTestCases = (cases = []) =>
  cases
    .map((item) => ({
      input: asString(item?.input),
      output: asString(item?.output),
      explanation: asString(item?.explanation),
    }))
    .filter((item) => item.input || item.output || item.explanation);

const cleanHiddenTestCases = (cases = []) =>
  cases
    .map((item) => ({
      input: asString(item?.input),
      output: asString(item?.output),
    }))
    .filter((item) => item.input || item.output);

export const buildProblemPayload = (form) => ({
  title: asString(form.title).trim(),
  slug: slugifyProblemTitle(form.slug || form.title || ""),
  description: asString(form.description).trim(),
  difficulty: form.difficulty || "Easy",
  tags: cleanStringList(form.tags),
  constraints: cleanStringList(form.constraints),
  hints: cleanStringList(form.hints),
  examples: cleanExamples(form.examples),
  visibleTestCases: cleanVisibleTestCases(form.visibleTestCases),
  hiddenTestCases: cleanHiddenTestCases(form.hiddenTestCases),
  starterCode: ensureCodeBundle(form.starterCode),
  referenceSolution: ensureCodeBundle(form.referenceSolution),
  isActive: Boolean(form.isActive),
});
