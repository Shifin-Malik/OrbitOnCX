import { PDFParse } from "pdf-parse";
import { slugify } from "../models/ProblemModel.js";

const DIFFICULTY_VALUES = ["Easy", "Medium", "Hard"];
const CODE_LANG_KEYS = ["javascript", "python", "java", "cpp"];

const REJECT_TITLE_SET = new Set([
  "BLIND 75 LEETCODE",
  "QUESTIONS",
  "AlgoTutor",
  "Array",
  "Matrix",
  "String",
  "Tree",
  "Graph",
  "Linked List",
  "Dynamic Programming",
  "Interval",
  "Bitwise Operator",
  "Heap",
]);

const CATEGORY_LINES = new Set([
  "Array",
  "Matrix",
  "String",
  "Tree",
  "Graph",
  "Linked List",
  "Dynamic Programming",
  "Interval",
  "Bitwise Operator",
  "Heap",
]);

const NOISE_PATTERNS = [
  /PRACTICE NOW/i,
  /EXPLORE MORE/i,
  /AlgoTutor/i,
  /\+91-\d+/i,
  /info@/i,
  /www\./i,
  /For Admission Enquiry/i,
  /Join our Popular courses/i,
  /Why Choose AlgoTutor/i,
  /^-?-?\s*\d+\s+of\s+\d+\s*-?-?$/i,
  /^--\s*\d+\s+of\s+\d+\s*--$/i,
  /^\d{1,2}$/i,
];

const PROMO_PATTERNS = [
  /course/i,
  /admission/i,
  /enquiry/i,
  /popular courses/i,
  /explore/i,
  /practice now/i,
  /contact/i,
  /call now/i,
];

const PROBLEM_HEADING_REGEX = /^\s*(\d{1,3})\.\s+(.+?)\s*$/;
const SECTION_HEADING_REGEXES = [
  { key: "description", regex: /^(description|problem\s*statement|statement)\s*[:\-]?\s*(.*)$/i },
  { key: "constraints", regex: /^constraints?\s*[:\-]?\s*(.*)$/i },
  { key: "examples", regex: /^examples?\s*[:\-]?\s*(.*)$/i },
  {
    key: "visibleTestCases",
    regex: /^(visible|public|sample)\s*test\s*cases?\s*[:\-]?\s*(.*)$/i,
  },
  {
    key: "hiddenTestCases",
    regex: /^(hidden|private)\s*test\s*cases?\s*[:\-]?\s*(.*)$/i,
  },
  {
    key: "starterCode",
    regex: /^(starter\s*code|boilerplate|template\s*code)\s*[:\-]?\s*(.*)$/i,
  },
  {
    key: "referenceSolution",
    regex: /^(reference\s*solution|solution|editorial)\s*[:\-]?\s*(.*)$/i,
  },
];

const EXAMPLE_START_REGEX = /^example\s*\d*\s*[:.)-]?\s*(.*)$/i;
const TESTCASE_START_REGEX = /^(test\s*case|case)\s*\d*\s*[:.)-]?\s*(.*)$/i;
const FIELD_LINE_REGEX = /^(input|output|explanation)\s*[:\-]\s*(.*)$/i;

const LANGUAGE_HEADER_REGEX =
  /^(javascript|js|node(?:\.?js)?|python|py|java|c\+\+|cpp)\s*[:\-]?\s*(.*)$/i;
const CODE_FENCE_REGEX = /^```([a-zA-Z+]+)?\s*$/;

const COUNT_FIELD_PATTERNS = [
  { key: "submissionsCount", regex: /\bsubmissions(?:\s*count)?\s*[:\-]\s*(\d+)\b/i },
  { key: "solvedCount", regex: /\bsolved(?:\s*count)?\s*[:\-]\s*(\d+)\b/i },
  { key: "submissionCount", regex: /\bsubmission(?:s)?\s*count\s*[:\-]\s*(\d+)\b/i },
  { key: "acceptanceCount", regex: /\bacceptance(?:\s*count)?\s*[:\-]\s*(\d+)\b/i },
];

const DIGIT_WORDS = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
};

const UPPER_REJECT_TITLE_SET = new Set(
  [...REJECT_TITLE_SET].map((value) => String(value).trim().toUpperCase()),
);
const UPPER_CATEGORY_SET = new Set(
  [...CATEGORY_LINES].map((value) => String(value).trim().toUpperCase()),
);

const createEmptyCodeBundle = () => ({
  javascript: "",
  python: "",
  java: "",
  cpp: "",
});

const createEmptyProblem = () => ({
  title: "",
  description: "",
  difficulty: "Easy",
  tags: [],
  constraints: [],
  examples: [],
  visibleTestCases: [],
  hiddenTestCases: [],
  starterCode: createEmptyCodeBundle(),
  referenceSolution: createEmptyCodeBundle(),
  submissionsCount: 0,
  solvedCount: 0,
  submissionCount: 0,
  acceptanceCount: 0,
});

const asString = (value) => String(value ?? "");

const normalizeLineEnding = (value) =>
  asString(value)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

const clampToNonNegativeInt = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
};

const trimArrayStrings = (values = []) =>
  values.map((entry) => asString(entry).trim()).filter(Boolean);

const normalizeSpaces = (value) =>
  asString(value)
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

const toUpperKey = (value) => normalizeSpaces(value).toUpperCase();

const isRejectTitle = (value) => UPPER_REJECT_TITLE_SET.has(toUpperKey(value));

const isCategoryLine = (line) => {
  const normalized = normalizeSpaces(line).replace(/[:\-]+$/, "");
  if (!normalized) return false;
  return UPPER_CATEGORY_SET.has(normalized.toUpperCase());
};

const containsPromoText = (line) => {
  const value = asString(line);
  if (!value) return false;
  return PROMO_PATTERNS.some((regex) => regex.test(value));
};

const isNoiseLine = (line) => {
  const value = normalizeSpaces(line);
  if (!value) return true;
  if (NOISE_PATTERNS.some((regex) => regex.test(value))) return true;
  if (/https?:\/\//i.test(value)) return true;
  if (/^copyright\b/i.test(value)) return true;
  if (/^all rights reserved\b/i.test(value)) return true;
  if (isRejectTitle(value) && !isCategoryLine(value)) return true;
  if (containsPromoText(value)) return true;
  return false;
};

const sanitizeHeadingTitle = (rawTitle) => {
  let title = normalizeSpaces(rawTitle)
    .replace(/^problem\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^question\s*\d+\s*[:.)-]\s*/i, "")
    .replace(/^title\s*[:\-]\s*/i, "");

  if (/\s+\d{1,3}$/.test(title)) {
    title = title.replace(/\s+\d{1,3}$/, "").trim();
  }

  title = title.replace(/\s*[-|:]\s*$/, "").trim();
  return title;
};

const parseProblemHeading = (line) => {
  const raw = normalizeSpaces(line);
  const match = raw.match(PROBLEM_HEADING_REGEX);
  if (!match) return null;

  const number = Number.parseInt(match[1], 10);
  const title = sanitizeHeadingTitle(match[2]);
  if (!title) return null;
  if (isRejectTitle(title)) return null;
  if (isCategoryLine(title)) return null;
  if (/BLIND|ALGOTUTOR|@|www\.|\+91-/i.test(title)) return null;
  if (containsPromoText(title)) return null;

  return {
    number,
    title,
  };
};

const isValidProblemHeading = (line) => Boolean(parseProblemHeading(line));

const cleanPdfPageText = (pageText) => {
  const normalizedPage = normalizeLineEnding(pageText);
  const rawLines = normalizedPage
    .split("\n")
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);

  const frequency = new Map();
  rawLines.forEach((line) => {
    frequency.set(line, (frequency.get(line) || 0) + 1);
  });

  const cleaned = [];
  rawLines.forEach((line) => {
    if (isNoiseLine(line)) return;
    if (!isCategoryLine(line) && frequency.get(line) > 2 && line.length < 80) return;
    if (cleaned.length > 0 && cleaned[cleaned.length - 1] === line) return;
    cleaned.push(line);
  });

  return cleaned.join("\n").trim();
};

const isLikelyAdPage = (cleanText) => {
  const lines = asString(cleanText)
    .split("\n")
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);

  if (lines.length === 0) return true;

  const headingCount = lines.filter((line) => isValidProblemHeading(line)).length;
  if (headingCount > 0) return false;

  const promoCount = lines.filter(
    (line) =>
      containsPromoText(line) ||
      (isRejectTitle(line) && !isCategoryLine(line)) ||
      /info@|www\.|\+91-/i.test(line),
  ).length;
  const categoryCount = lines.filter((line) => isCategoryLine(line)).length;
  const structuredCount = lines.filter((line) =>
    /^(difficulty|tags?|constraints?|examples?|input|output|explanation|starter|solution|visible|hidden)\b/i.test(
      line,
    ),
  ).length;

  if (promoCount >= 2 && structuredCount === 0) return true;
  if (promoCount + categoryCount >= Math.max(2, Math.floor(lines.length * 0.6))) return true;

  return headingCount === 0;
};

const splitRawTextIntoPages = (rawText) => {
  let normalized = normalizeLineEnding(rawText)
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");

  if (!normalized.includes("\f")) {
    normalized = normalized
      .replace(/\n(?=--\s*\d+\s+of\s+\d+\s*--\s*(?:\n|$))/gi, "\f")
      .replace(/\n(?=\s*\d+\s+of\s+\d+\s*(?:\n|$))/gi, "\f");
  }

  return normalized
    .split(/\f+/)
    .map((page) => page.trim())
    .filter(Boolean);
};

const isHardBoundaryLine = (line) =>
  isNoiseLine(line) ||
  containsPromoText(line) ||
  (isRejectTitle(line) && !isCategoryLine(line));

const extractProblemCandidatesFromPage = (cleanText, pageNumber) => {
  const lines = asString(cleanText)
    .split("\n")
    .map((line) => normalizeSpaces(line))
    .filter(Boolean);

  if (lines.length === 0) return [];

  let currentCategory = "";
  const headingEntries = [];

  lines.forEach((line, index) => {
    if (isCategoryLine(line)) {
      currentCategory = line;
      return;
    }

    const heading = parseProblemHeading(line);
    if (!heading) return;

    headingEntries.push({
      ...heading,
      lineIndex: index,
      category: currentCategory,
    });
  });

  if (headingEntries.length === 0) return [];

  const candidates = [];
  headingEntries.forEach((heading, index) => {
    const nextStart = headingEntries[index + 1]?.lineIndex ?? lines.length;
    let stopIndex = nextStart;

    for (let cursor = heading.lineIndex + 1; cursor < nextStart; cursor += 1) {
      const line = lines[cursor];
      if (isCategoryLine(line) || isHardBoundaryLine(line) || isValidProblemHeading(line)) {
        stopIndex = cursor;
        break;
      }
    }

    const segmentLines = lines.slice(heading.lineIndex, stopIndex);
    if (segmentLines.length < 2) return;

    candidates.push({
      pageNumber,
      category: heading.category || "",
      headingNumber: heading.number,
      headingTitle: heading.title,
      segmentText: segmentLines.join("\n"),
    });
  });

  return candidates;
};

const parseTagsValue = (rawValue) =>
  trimArrayStrings(
    asString(rawValue)
      .split(/[,\|;/]/g)
      .map((entry) => entry.trim().toLowerCase()),
  );

const normalizeDifficulty = (value) => {
  const normalized = normalizeSpaces(value).toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return "";
};

const inferDifficulty = ({ explicitDifficulty, title, description }) => {
  const explicit = normalizeDifficulty(explicitDifficulty);
  if (explicit) return explicit;

  const corpus = `${title} ${description}`.toLowerCase();
  if (/\bhard\b/.test(corpus)) return "Hard";
  if (/\bmedium\b/.test(corpus)) return "Medium";
  if (/\bdynamic programming|segment tree|union find|backtracking|topological\b/.test(corpus)) {
    return "Medium";
  }
  return "Easy";
};

const inferTagsFromText = ({ explicitTags, title, description, category }) => {
  const tags = new Set(
    trimArrayStrings(explicitTags || []).map((tag) => normalizeSpaces(tag).toLowerCase()),
  );

  if (category && isCategoryLine(category)) {
    tags.add(normalizeSpaces(category).toLowerCase());
  }

  const corpus = `${title} ${description}`.toLowerCase();
  const keywordMap = [
    { tag: "array", regex: /\barray|arrays|nums\b/ },
    { tag: "string", regex: /\bstring|substring|character\b/ },
    { tag: "linked list", regex: /\blinked list|listnode\b/ },
    { tag: "tree", regex: /\btree\b|\bbst\b|binary tree/ },
    { tag: "graph", regex: /\bgraph|vertex|edge\b/ },
    { tag: "dynamic programming", regex: /\bdynamic programming|dp\b/ },
    { tag: "hash map", regex: /\bhash map|hash table|dictionary\b/ },
    { tag: "two pointers", regex: /\btwo pointers?\b/ },
    { tag: "stack", regex: /\bstack\b/ },
    { tag: "queue", regex: /\bqueue\b/ },
    { tag: "math", regex: /\bmath|integer|prime|mod\b/ },
  ];

  keywordMap.forEach(({ tag, regex }) => {
    if (regex.test(corpus)) {
      tags.add(tag);
    }
  });

  return [...tags].filter(Boolean);
};

const parseConstraintList = (lines) =>
  trimArrayStrings(
    lines.map((line) =>
      normalizeSpaces(line)
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\s*[.)]\s+/, ""),
    ),
  ).filter((line) => !isHardBoundaryLine(line) && !isCategoryLine(line));

const mapLanguageTokenToKey = (token) => {
  const normalized = normalizeSpaces(token).toLowerCase();
  if (["javascript", "js", "nodejs", "node.js"].includes(normalized)) return "javascript";
  if (["python", "py"].includes(normalized)) return "python";
  if (normalized === "java") return "java";
  if (["c++", "cpp"].includes(normalized)) return "cpp";
  return "";
};

const cleanCodeText = (text) =>
  asString(text)
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const parseCodeBundle = (lines) => {
  const bundle = createEmptyCodeBundle();
  if (!Array.isArray(lines) || lines.length === 0) return bundle;

  let currentLanguage = "";
  let inFence = false;

  lines.forEach((rawLine) => {
    const line = asString(rawLine).replace(/\s+$/g, "");
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentLanguage) {
        bundle[currentLanguage] = `${bundle[currentLanguage]}\n`;
      }
      return;
    }

    const fenceMatch = trimmed.match(CODE_FENCE_REGEX);
    if (fenceMatch) {
      if (!inFence) {
        inFence = true;
        const fencedLanguage = mapLanguageTokenToKey(fenceMatch[1]);
        if (fencedLanguage) currentLanguage = fencedLanguage;
      } else {
        inFence = false;
      }
      return;
    }

    const langMatch = trimmed.match(LANGUAGE_HEADER_REGEX);
    if (!inFence && langMatch) {
      const langKey = mapLanguageTokenToKey(langMatch[1]);
      if (langKey) {
        currentLanguage = langKey;
        const remainder = normalizeSpaces(langMatch[2]);
        if (remainder) {
          bundle[currentLanguage] = `${bundle[currentLanguage]}${remainder}\n`;
        }
        return;
      }
    }

    if (currentLanguage && CODE_LANG_KEYS.includes(currentLanguage)) {
      bundle[currentLanguage] = `${bundle[currentLanguage]}${line}\n`;
    }
  });

  CODE_LANG_KEYS.forEach((key) => {
    bundle[key] = cleanCodeText(bundle[key]);
  });

  return bundle;
};

const parseCounterFields = (lines) => {
  const counters = {
    submissionsCount: 0,
    solvedCount: 0,
    submissionCount: 0,
    acceptanceCount: 0,
  };

  lines.forEach((line) => {
    COUNT_FIELD_PATTERNS.forEach(({ key, regex }) => {
      const match = asString(line).match(regex);
      if (match?.[1] !== undefined) {
        counters[key] = clampToNonNegativeInt(match[1]);
      }
    });
  });

  if (!counters.submissionCount) counters.submissionCount = counters.submissionsCount;
  if (!counters.submissionsCount) counters.submissionsCount = counters.submissionCount;
  if (!counters.acceptanceCount) counters.acceptanceCount = counters.solvedCount;
  if (!counters.solvedCount) counters.solvedCount = counters.acceptanceCount;

  return counters;
};

const parseSectionHeading = (line) => {
  for (const entry of SECTION_HEADING_REGEXES) {
    const match = asString(line).match(entry.regex);
    if (!match) continue;
    return {
      key: entry.key,
      inline: normalizeSpaces(match[2] || ""),
    };
  }
  return null;
};

const parseFieldSegments = (line) => {
  const matches = [...line.matchAll(/\b(input|output|explanation)\s*[:\-]\s*/gi)];
  if (matches.length === 0) return null;

  const fields = {};
  let lastField = "";

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const field = current[1].toLowerCase();
    const valueStart = current.index + current[0].length;
    const valueEnd = next ? next.index : line.length;
    fields[field] = line.slice(valueStart, valueEnd).trim();
    lastField = field;
  }

  return { fields, lastField };
};

const isCaseBoundaryLine = (line) => {
  if (!line) return false;
  if (isValidProblemHeading(line)) return true;
  if (isCategoryLine(line)) return true;
  if (isHardBoundaryLine(line)) return true;
  if (
    /^(constraints?|hints?|starter\s*code|boilerplate|template\s*code|reference\s*solution|solution|editorial|visible\s*test\s*cases?|hidden\s*test\s*cases?|private\s*test\s*cases?)\b/i.test(
      line,
    )
  ) {
    return true;
  }
  return false;
};

const parseInputOutputBlocks = (
  lines,
  { allowExplanation = true, startRegex = null } = {},
) => {
  const parsed = [];
  let current = null;
  let activeField = "";

  const flush = () => {
    if (!current) return;
    const normalized = {
      input: normalizeSpaces(current.input),
      output: normalizeSpaces(current.output),
      explanation: allowExplanation ? normalizeSpaces(current.explanation) : "",
    };

    if (normalized.input || normalized.output || normalized.explanation) {
      parsed.push(normalized);
    }

    current = null;
    activeField = "";
  };

  for (const rawLine of lines) {
    const line = normalizeSpaces(rawLine);
    if (!line) {
      activeField = "";
      continue;
    }

    if (isCaseBoundaryLine(line)) {
      flush();
      break;
    }

    if (startRegex && startRegex.test(line)) {
      flush();
      current = { input: "", output: "", explanation: "" };
      const remainder = normalizeSpaces(line.replace(startRegex, "$2"));
      if (remainder) {
        const segments = parseFieldSegments(remainder);
        if (segments?.fields) {
          current = { ...current, ...segments.fields };
          activeField = segments.lastField;
        }
      }
      continue;
    }

    const inlineSegments = parseFieldSegments(line);
    if (inlineSegments?.fields) {
      if (!current) {
        current = { input: "", output: "", explanation: "" };
      }
      current = { ...current, ...inlineSegments.fields };
      activeField = inlineSegments.lastField;
      continue;
    }

    const directField = line.match(FIELD_LINE_REGEX);
    if (directField) {
      if (!current) {
        current = { input: "", output: "", explanation: "" };
      }
      const field = directField[1].toLowerCase();
      if (field === "explanation" && !allowExplanation) continue;
      current[field] = normalizeSpaces(directField[2]);
      activeField = field;
      continue;
    }

    if (!current) continue;

    if (activeField && current[activeField] !== undefined) {
      const separator = activeField === "explanation" ? "\n" : " ";
      current[activeField] = `${current[activeField]}${separator}${line}`.trim();
      continue;
    }

    if (!current.input) {
      current.input = line;
      activeField = "input";
    }
  }

  flush();
  return parsed;
};

const normalizeDescription = (lines) => {
  const paragraphs = [];
  let bucket = [];

  const flush = () => {
    if (bucket.length === 0) return;
    paragraphs.push(bucket.join(" ").replace(/\s{2,}/g, " ").trim());
    bucket = [];
  };

  lines.forEach((rawLine) => {
    const line = normalizeSpaces(rawLine);
    if (!line) {
      flush();
      return;
    }
    if (isHardBoundaryLine(line) || isCategoryLine(line) || isValidProblemHeading(line)) {
      flush();
      return;
    }
    bucket.push(line);
  });

  flush();
  return paragraphs.join("\n\n").trim();
};

const sanitizeTextBlock = (
  value,
  { cutOnHeadingLeak = false, allowStandaloneNumbers = false } = {},
) => {
  const lines = normalizeLineEnding(value)
    .split("\n")
    .map((line) => normalizeSpaces(line));

  const kept = [];
  for (const line of lines) {
    if (!line) {
      if (kept.length > 0 && kept[kept.length - 1] !== "") {
        kept.push("");
      }
      continue;
    }

    const isStandaloneNumber = /^-?\d+(?:\.\d+)?$/.test(line);
    if (isHardBoundaryLine(line) && !(allowStandaloneNumbers && isStandaloneNumber)) {
      continue;
    }

    if (cutOnHeadingLeak && (isValidProblemHeading(line) || isCategoryLine(line))) {
      break;
    }

    kept.push(line);
  }

  while (kept.length > 0 && kept[0] === "") kept.shift();
  while (kept.length > 0 && kept[kept.length - 1] === "") kept.pop();

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

const stripEmbeddedHeadingLeakage = (value) => {
  const text = asString(value || "").trim();
  if (!text) return "";

  const match = text.match(/\b\d{1,3}\.\s+[A-Z][A-Za-z0-9]*(?:\s+[A-Za-z0-9]+){0,8}/);
  if (!match || match.index === undefined) return text;

  const prefix = text.slice(0, match.index).trim();
  return prefix || text;
};

const numberTokenToWord = (token) => {
  if (DIGIT_WORDS[token] !== undefined) return DIGIT_WORDS[token];
  if (/^\d$/.test(token) && DIGIT_WORDS[token] !== undefined) return DIGIT_WORDS[token];
  return `num${token}`;
};

const normalizeTitleTokens = (title) => {
  let normalized = asString(title)
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((token) => {
      if (/^\d+$/.test(token)) return numberTokenToWord(token);
      return token;
    })
    .filter(Boolean);
};

const toCamelCase = (tokens) => {
  if (!Array.isArray(tokens) || tokens.length === 0) return "solveProblem";
  const [first, ...rest] = tokens;
  const candidate = `${first}${rest
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
  if (!/^[a-zA-Z_]\w*$/.test(candidate)) return "solveProblem";
  return candidate;
};

const toSnakeCase = (tokens) => {
  if (!Array.isArray(tokens) || tokens.length === 0) return "solve_problem";
  const candidate = tokens.join("_");
  if (!/^[a-zA-Z_]\w*$/.test(candidate)) return "solve_problem";
  return candidate;
};

const extractNamedParamsFromInput = (inputText) => {
  const names = [];
  const seen = new Set();
  const matches = [...asString(inputText).matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g)];
  matches.forEach((match) => {
    const name = match[1];
    if (!name || seen.has(name)) return;
    seen.add(name);
    names.push(name);
  });
  return names;
};

const inferParameterNames = (problem) => {
  const fromExamples = [];
  const exampleSources = [
    ...(Array.isArray(problem.examples) ? problem.examples : []),
    ...(Array.isArray(problem.visibleTestCases) ? problem.visibleTestCases : []),
  ];

  for (const item of exampleSources) {
    const extracted = extractNamedParamsFromInput(item?.input || "");
    extracted.forEach((name) => {
      if (!fromExamples.includes(name)) fromExamples.push(name);
    });
    if (fromExamples.length >= 4) break;
  }

  if (fromExamples.length > 0) return fromExamples.slice(0, 4);

  const corpus = `${problem.title} ${problem.description}`.toLowerCase();
  const inferred = [];
  if (/\bnums?\b|\barray\b/.test(corpus)) inferred.push("nums");
  if (/\bmatrix\b|\bgrid\b|\bboard\b/.test(corpus)) inferred.push("matrix");
  if (/\bstring\b|\bsubstring\b/.test(corpus)) inferred.push("s");
  if (/\btarget\b/.test(corpus)) inferred.push("target");
  if (/\bkth\b|\bk\b/.test(corpus)) inferred.push("k");
  if (/\bworddict\b/.test(corpus)) inferred.push("wordDict");

  if (inferred.length > 0) return [...new Set(inferred)].slice(0, 4);
  return ["input"];
};

const inferParamKind = (name, problem) => {
  const token = normalizeSpaces(name).toLowerCase();
  const corpus = `${problem.title} ${problem.description}`.toLowerCase();

  if (/matrix|grid|board/.test(token)) return "matrix";
  if (/nums?|arr|array|list|values|heights|weights|intervals|edges/.test(token)) return "array";
  if (/str|string|word|pattern|text|path|s/.test(token)) {
    if (/array|string/.test(corpus)) {
      if (/string/.test(corpus) && !/array/.test(corpus)) return "string";
    }
    if (token === "s" || /string|word|pattern|text/.test(token)) return "string";
  }
  if (/is|has|can/.test(token)) return "boolean";
  return "int";
};

const inferReturnKind = (problem) => {
  const corpus = `${problem.title} ${problem.description}`.toLowerCase();
  if (/\btrue or false\b|\bboolean\b|\bwhether\b|\bpossible\b|\bcan\b/.test(corpus)) {
    return "boolean";
  }
  if (/\breturn\b[^.]*\bstring\b/.test(corpus) || /\breturn a string\b/.test(corpus)) {
    return "string";
  }
  if (
    /\breturn\b[^.]*\b(array|list|indices|subset|permutation|combination|vector)\b/.test(
      corpus,
    )
  ) {
    return "array";
  }
  if (
    /\breturn\b[^.]*\b(length|count|number|maximum|min(?:imum)?|kth|sum|profit|index)\b/.test(
      corpus,
    )
  ) {
    return "integer";
  }
  return "integer";
};

const toJavaParam = (name, kind) => {
  if (kind === "array") return `int[] ${name}`;
  if (kind === "matrix") return `int[][] ${name}`;
  if (kind === "string") return `String ${name}`;
  if (kind === "boolean") return `boolean ${name}`;
  return `int ${name}`;
};

const toCppParam = (name, kind) => {
  if (kind === "array") return `vector<int>& ${name}`;
  if (kind === "matrix") return `vector<vector<int>>& ${name}`;
  if (kind === "string") return `string ${name}`;
  if (kind === "boolean") return `bool ${name}`;
  return `int ${name}`;
};

const getJavaReturnType = (kind) => {
  if (kind === "boolean") return "boolean";
  if (kind === "string") return "String";
  if (kind === "array") return "int[]";
  return "int";
};

const getCppReturnType = (kind) => {
  if (kind === "boolean") return "bool";
  if (kind === "string") return "string";
  if (kind === "array") return "vector<int>";
  return "int";
};

const getJavaDefaultReturn = (kind) => {
  if (kind === "boolean") return "return false;";
  if (kind === "string") return 'return "";';
  if (kind === "array") return "return new int[0];";
  return "return 0;";
};

const getCppDefaultReturn = (kind) => {
  if (kind === "boolean") return "return false;";
  if (kind === "string") return 'return "";';
  if (kind === "array") return "return {};";
  return "return 0;";
};

const buildStarterCode = (problem) => {
  const tokens = normalizeTitleTokens(problem.title);
  const jsFunctionName = toCamelCase(tokens);
  const pythonFunctionName = toSnakeCase(tokens);
  const javaMethodName = toCamelCase(tokens);
  const cppMethodName = toCamelCase(tokens);

  const params = inferParameterNames(problem);
  const paramKinds = params.map((name) => inferParamKind(name, problem));
  const returnKind = inferReturnKind(problem);

  const javascript = `function ${jsFunctionName}(${params.join(", ")}) {\n  // write your code here\n}`;
  const python = `def ${pythonFunctionName}(${params.join(", ")}):\n    # write your code here\n    pass`;

  const javaParams = params
    .map((name, index) => toJavaParam(name, paramKinds[index]))
    .join(", ");
  const java = `class Solution {\n  public ${getJavaReturnType(returnKind)} ${javaMethodName}(${javaParams}) {\n    // write your code here\n    ${getJavaDefaultReturn(returnKind)}\n  }\n}`;

  const cppParams = params
    .map((name, index) => toCppParam(name, paramKinds[index]))
    .join(", ");
  const requiresString =
    returnKind === "string" || paramKinds.some((kind) => kind === "string");
  const cppIncludes = requiresString ? "#include <vector>\n#include <string>" : "#include <vector>";
  const cpp = `${cppIncludes}\nusing namespace std;\n\n${getCppReturnType(returnKind)} ${cppMethodName}(${cppParams}) {\n  // write your code here\n  ${getCppDefaultReturn(returnKind)}\n}`;

  return {
    javascript,
    python,
    java,
    cpp,
  };
};

const isReliableReferenceCode = (code) => {
  const snippet = cleanCodeText(code);
  if (!snippet) return false;
  if (snippet.length < 32) return false;
  if (containsPromoText(snippet)) return false;
  if (isNoiseLine(snippet)) return false;
  return /return|class|def |function|#include|public\s+|while\s*\(|for\s*\(/.test(snippet);
};

const buildReferenceSolution = (problem, extractedBundle = createEmptyCodeBundle()) => {
  const result = createEmptyCodeBundle();
  CODE_LANG_KEYS.forEach((language) => {
    const code = cleanCodeText(extractedBundle?.[language]);
    if (isReliableReferenceCode(code)) {
      result[language] = code;
    }
  });
  return result;
};

const sanitizeParsedProblem = (problem) => {
  const sanitized = createEmptyProblem();

  sanitized.title = sanitizeHeadingTitle(problem.title);
  sanitized.description = sanitizeTextBlock(problem.description, {
    cutOnHeadingLeak: true,
  });
  sanitized.difficulty = normalizeDifficulty(problem.difficulty) || "Easy";

  sanitized.tags = [...new Set(
    trimArrayStrings(problem.tags || [])
      .map((tag) => normalizeSpaces(tag).toLowerCase())
      .filter((tag) => tag && !isHardBoundaryLine(tag)),
  )];

  sanitized.constraints = trimArrayStrings(problem.constraints || [])
    .map((line) => sanitizeTextBlock(line, { cutOnHeadingLeak: true }))
    .filter((line) => line && !isHardBoundaryLine(line) && !isCategoryLine(line));

  sanitized.examples = (Array.isArray(problem.examples) ? problem.examples : [])
    .map((example) => ({
      input: sanitizeTextBlock(example?.input, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
      output: sanitizeTextBlock(example?.output, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
      explanation: sanitizeTextBlock(example?.explanation, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
    }))
    .map((entry) => ({
      ...entry,
      output: stripEmbeddedHeadingLeakage(entry.output.split("\n")[0]?.trim() || entry.output),
      explanation: stripEmbeddedHeadingLeakage(
        entry.explanation.split("\n")[0]?.trim() || entry.explanation,
      ),
    }))
    .filter((entry) => entry.input || entry.output || entry.explanation);

  sanitized.visibleTestCases = (Array.isArray(problem.visibleTestCases)
    ? problem.visibleTestCases
    : [])
    .map((testCase) => ({
      input: sanitizeTextBlock(testCase?.input, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
      output: sanitizeTextBlock(testCase?.output, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
    }))
    .map((entry) => ({
      input: entry.input.split("\n")[0]?.trim() || entry.input,
      output: stripEmbeddedHeadingLeakage(entry.output.split("\n")[0]?.trim() || entry.output),
    }))
    .filter((entry) => entry.input || entry.output);

  sanitized.hiddenTestCases = (Array.isArray(problem.hiddenTestCases)
    ? problem.hiddenTestCases
    : [])
    .map((testCase) => ({
      input: sanitizeTextBlock(testCase?.input, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
      output: sanitizeTextBlock(testCase?.output, {
        cutOnHeadingLeak: true,
        allowStandaloneNumbers: true,
      }),
    }))
    .map((entry) => ({
      input: entry.input.split("\n")[0]?.trim() || entry.input,
      output: stripEmbeddedHeadingLeakage(entry.output.split("\n")[0]?.trim() || entry.output),
    }))
    .filter((entry) => entry.input || entry.output);

  const generatedStarter = buildStarterCode({
    ...problem,
    title: sanitized.title,
    description: sanitized.description,
    examples: sanitized.examples,
    visibleTestCases: sanitized.visibleTestCases,
  });

  sanitized.starterCode = createEmptyCodeBundle();
  CODE_LANG_KEYS.forEach((language) => {
    const extractedCode = cleanCodeText(problem.starterCode?.[language]);
    sanitized.starterCode[language] = extractedCode || generatedStarter[language] || "";
  });

  const referenceSolution = buildReferenceSolution(problem, problem.referenceSolution);
  sanitized.referenceSolution = {
    javascript: referenceSolution.javascript,
    python: referenceSolution.python,
    java: referenceSolution.java,
    cpp: referenceSolution.cpp,
  };

  sanitized.submissionsCount = clampToNonNegativeInt(
    problem.submissionsCount ?? problem.submissionCount,
  );
  sanitized.solvedCount = clampToNonNegativeInt(
    problem.solvedCount ?? problem.acceptanceCount,
  );
  sanitized.submissionCount = clampToNonNegativeInt(
    problem.submissionCount ?? problem.submissionsCount,
  );
  sanitized.acceptanceCount = clampToNonNegativeInt(
    problem.acceptanceCount ?? problem.solvedCount,
  );

  if (!sanitized.submissionCount) sanitized.submissionCount = sanitized.submissionsCount;
  if (!sanitized.submissionsCount) sanitized.submissionsCount = sanitized.submissionCount;
  if (!sanitized.acceptanceCount) sanitized.acceptanceCount = sanitized.solvedCount;
  if (!sanitized.solvedCount) sanitized.solvedCount = sanitized.acceptanceCount;

  if (sanitized.visibleTestCases.length === 0 && sanitized.examples.length > 0) {
    sanitized.visibleTestCases = sanitized.examples
      .map((example) => ({
        input: example.input,
        output: example.output,
      }))
      .filter((entry) => entry.input && entry.output);
  }

  return sanitized;
};

const isMostlyNoiseDescription = (description) => {
  const text = asString(description);
  if (!text) return true;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 6) return true;
  const alphaCount = (text.match(/[a-z]/gi) || []).length;
  if (alphaCount < 20) return true;
  const promoHits = words.filter((word) =>
    /(practice|explore|admission|enquiry|course|algotutor|www|info@)/i.test(word),
  ).length;
  return promoHits / words.length > 0.2;
};

const hasHeadingLeakage = (value) => {
  const text = asString(value);
  if (!text) return false;
  if (PROBLEM_HEADING_REGEX.test(text.trim())) return true;
  if (/\b\d{1,3}\.\s+[A-Z][A-Za-z]/.test(text)) return true;
  if (/\n\s*\d{1,3}\.\s+[A-Za-z]/.test(text)) return true;
  if (isCategoryLine(text.trim())) return true;
  return false;
};

const isValidParsedProblem = (problem) => {
  const title = normalizeSpaces(problem.title);
  const description = asString(problem.description).trim();

  if (!title) return false;
  if (title.length < 3) return false;
  if (isRejectTitle(title)) return false;
  if (isCategoryLine(title)) return false;
  if (/BLIND|ALGOTUTOR|@|www\.|\+91-/i.test(title)) return false;
  if (!description) return false;
  if (containsPromoText(description)) return false;
  if (isMostlyNoiseDescription(description)) return false;

  const allFieldsToScan = [
    ...(Array.isArray(problem.constraints) ? problem.constraints : []),
    ...(Array.isArray(problem.tags) ? problem.tags : []),
  ];
  if (allFieldsToScan.some((value) => containsPromoText(value) || isNoiseLine(value))) {
    return false;
  }

  if (
    (Array.isArray(problem.examples) ? problem.examples : []).some(
      (example) =>
        hasHeadingLeakage(example.output) ||
        hasHeadingLeakage(example.explanation) ||
        containsPromoText(example.output) ||
        containsPromoText(example.explanation),
    )
  ) {
    return false;
  }

  if (
    (Array.isArray(problem.visibleTestCases) ? problem.visibleTestCases : []).some(
      (testCase) => hasHeadingLeakage(testCase.output) || containsPromoText(testCase.output),
    )
  ) {
    return false;
  }

  if (
    (Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases : []).some(
      (testCase) => hasHeadingLeakage(testCase.output) || containsPromoText(testCase.output),
    )
  ) {
    return false;
  }

  return true;
};

const parseProblemSegment = (segment, context = {}) => {
  const lines = normalizeLineEnding(segment.segmentText)
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""));

  if (lines.length === 0) return null;

  const heading = parseProblemHeading(lines[0]);
  if (!heading) return null;

  const sections = {
    description: [],
    constraints: [],
    examples: [],
    visibleTestCases: [],
    hiddenTestCases: [],
    starterCode: [],
    referenceSolution: [],
  };

  let currentSection = "description";
  let explicitDifficulty = "";
  const tags = [];

  if (context.category && isCategoryLine(context.category)) {
    tags.push(context.category.toLowerCase());
  }

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = normalizeSpaces(line);

    if (!trimmed) {
      sections[currentSection].push("");
      continue;
    }

    if (isValidProblemHeading(trimmed) || isCategoryLine(trimmed)) {
      break;
    }

    if (isHardBoundaryLine(trimmed)) {
      break;
    }

    const difficultyMatch = trimmed.match(/^difficulty\s*[:\-]\s*(.+)$/i);
    if (difficultyMatch) {
      explicitDifficulty = difficultyMatch[1];
      continue;
    }

    const tagsMatch = trimmed.match(/^tags?\s*[:\-]\s*(.+)$/i);
    if (tagsMatch) {
      tags.push(...parseTagsValue(tagsMatch[1]));
      continue;
    }

    const sectionHeading = parseSectionHeading(trimmed);
    if (sectionHeading) {
      currentSection = sectionHeading.key;
      if (sectionHeading.inline) {
        sections[currentSection].push(sectionHeading.inline);
      }
      continue;
    }

    if (
      currentSection === "description" &&
      (EXAMPLE_START_REGEX.test(trimmed) || FIELD_LINE_REGEX.test(trimmed))
    ) {
      currentSection = "examples";
    }

    sections[currentSection].push(line);
  }

  const fallbackExampleLines =
    sections.examples.length > 0
      ? sections.examples
      : sections.description.filter(
          (line) =>
            EXAMPLE_START_REGEX.test(normalizeSpaces(line)) ||
            FIELD_LINE_REGEX.test(normalizeSpaces(line)),
        );

  const examples = parseInputOutputBlocks(fallbackExampleLines, {
    allowExplanation: true,
    startRegex: EXAMPLE_START_REGEX,
  });

  const visibleTestCases = parseInputOutputBlocks(sections.visibleTestCases, {
    allowExplanation: false,
    startRegex: TESTCASE_START_REGEX,
  });

  const hiddenTestCases = parseInputOutputBlocks(sections.hiddenTestCases, {
    allowExplanation: false,
    startRegex: TESTCASE_START_REGEX,
  });

  const description = normalizeDescription(
    sections.description.filter(
      (line) =>
        !EXAMPLE_START_REGEX.test(normalizeSpaces(line)) &&
        !FIELD_LINE_REGEX.test(normalizeSpaces(line)),
    ),
  );

  const constraints = parseConstraintList(sections.constraints);
  const parsedStarterCode = parseCodeBundle(sections.starterCode);
  const parsedReferenceSolution = parseCodeBundle(sections.referenceSolution);
  const counters = parseCounterFields(lines.map((line) => normalizeSpaces(line)));
  const difficulty = inferDifficulty({
    explicitDifficulty,
    title: heading.title,
    description,
  });
  const inferredTags = inferTagsFromText({
    explicitTags: tags,
    title: heading.title,
    description,
    category: context.category || "",
  });

  return {
    title: heading.title,
    description,
    difficulty,
    tags: inferredTags,
    constraints,
    examples,
    visibleTestCases: visibleTestCases.map((item) => ({
      input: item.input,
      output: item.output,
    })),
    hiddenTestCases: hiddenTestCases.map((item) => ({
      input: item.input,
      output: item.output,
    })),
    starterCode: parsedStarterCode,
    referenceSolution: parsedReferenceSolution,
    submissionsCount: counters.submissionsCount,
    solvedCount: counters.solvedCount,
    submissionCount: counters.submissionCount,
    acceptanceCount: counters.acceptanceCount,
  };
};

const ensureExactProblemShape = (raw = {}) => {
  const problem = createEmptyProblem();

  problem.title = normalizeSpaces(raw.title);
  problem.description = asString(raw.description || "").trim();
  problem.difficulty = DIFFICULTY_VALUES.includes(raw.difficulty) ? raw.difficulty : "Easy";
  problem.tags = trimArrayStrings(raw.tags || []);
  problem.constraints = trimArrayStrings(raw.constraints || []);

  problem.examples = (Array.isArray(raw.examples) ? raw.examples : [])
    .map((example) => ({
      input: asString(example?.input).trim(),
      output: asString(example?.output).trim(),
      explanation: asString(example?.explanation).trim(),
    }))
    .filter((entry) => entry.input || entry.output || entry.explanation);

  problem.visibleTestCases = (Array.isArray(raw.visibleTestCases) ? raw.visibleTestCases : [])
    .map((testCase) => ({
      input: asString(testCase?.input).trim(),
      output: asString(testCase?.output).trim(),
    }))
    .filter((entry) => entry.input || entry.output);

  problem.hiddenTestCases = (Array.isArray(raw.hiddenTestCases) ? raw.hiddenTestCases : [])
    .map((testCase) => ({
      input: asString(testCase?.input).trim(),
      output: asString(testCase?.output).trim(),
    }))
    .filter((entry) => entry.input || entry.output);

  problem.starterCode = {
    javascript: asString(raw.starterCode?.javascript).trim(),
    python: asString(raw.starterCode?.python).trim(),
    java: asString(raw.starterCode?.java).trim(),
    cpp: asString(raw.starterCode?.cpp).trim(),
  };

  problem.referenceSolution = {
    javascript: asString(raw.referenceSolution?.javascript).trim(),
    python: asString(raw.referenceSolution?.python).trim(),
    java: asString(raw.referenceSolution?.java).trim(),
    cpp: asString(raw.referenceSolution?.cpp).trim(),
  };

  problem.submissionsCount = clampToNonNegativeInt(
    raw.submissionsCount ?? raw.submissionCount,
  );
  problem.solvedCount = clampToNonNegativeInt(raw.solvedCount ?? raw.acceptanceCount);
  problem.submissionCount = clampToNonNegativeInt(
    raw.submissionCount ?? raw.submissionsCount,
  );
  problem.acceptanceCount = clampToNonNegativeInt(
    raw.acceptanceCount ?? raw.solvedCount,
  );

  if (!problem.submissionCount) problem.submissionCount = problem.submissionsCount;
  if (!problem.submissionsCount) problem.submissionsCount = problem.submissionCount;
  if (!problem.acceptanceCount) problem.acceptanceCount = problem.solvedCount;
  if (!problem.solvedCount) problem.solvedCount = problem.acceptanceCount;

  if (problem.visibleTestCases.length === 0 && problem.examples.length > 0) {
    problem.visibleTestCases = problem.examples
      .map((example) => ({
        input: example.input,
        output: example.output,
      }))
      .filter((entry) => entry.input && entry.output);
  }

  return problem;
};

const validateParsedProblem = (problem) => {
  const errors = [];

  if (!problem.title) errors.push("title is required");
  if (!problem.description) errors.push("description is required");
  if (!DIFFICULTY_VALUES.includes(problem.difficulty)) {
    errors.push(`difficulty must be one of: ${DIFFICULTY_VALUES.join(", ")}`);
  }

  if (!Array.isArray(problem.tags)) errors.push("tags must be an array");
  if (!Array.isArray(problem.constraints)) errors.push("constraints must be an array");
  if (!Array.isArray(problem.examples)) errors.push("examples must be an array");
  if (!Array.isArray(problem.visibleTestCases)) errors.push("visibleTestCases must be an array");
  if (!Array.isArray(problem.hiddenTestCases)) errors.push("hiddenTestCases must be an array");

  problem.examples.forEach((example, index) => {
    if (!asString(example.input).trim()) errors.push(`examples[${index}].input is required`);
    if (!asString(example.output).trim()) errors.push(`examples[${index}].output is required`);
    if (example.explanation === undefined || example.explanation === null) {
      errors.push(`examples[${index}].explanation must be a string`);
    }
  });

  problem.visibleTestCases.forEach((testCase, index) => {
    if (!asString(testCase.input).trim()) {
      errors.push(`visibleTestCases[${index}].input is required`);
    }
    if (!asString(testCase.output).trim()) {
      errors.push(`visibleTestCases[${index}].output is required`);
    }
  });

  problem.hiddenTestCases.forEach((testCase, index) => {
    if (!asString(testCase.input).trim()) {
      errors.push(`hiddenTestCases[${index}].input is required`);
    }
    if (!asString(testCase.output).trim()) {
      errors.push(`hiddenTestCases[${index}].output is required`);
    }
  });

  CODE_LANG_KEYS.forEach((language) => {
    if (typeof problem.starterCode?.[language] !== "string") {
      errors.push(`starterCode.${language} must be a string`);
    }
    if (typeof problem.referenceSolution?.[language] !== "string") {
      errors.push(`referenceSolution.${language} must be a string`);
    }
  });

  if (!isValidParsedProblem(problem)) {
    errors.push("problem failed parser safety validation");
  }

  return errors;
};

export const normalizeTitleForDuplicateCheck = (title) =>
  slugify(asString(title).toLowerCase());

export const extractTextFromPdfBuffer = async (buffer) => {
  if (!buffer || !(buffer instanceof Buffer) || buffer.length === 0) {
    throw new Error("Invalid PDF buffer.");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({});
    const rawText = asString(result?.text).trim();
    if (!rawText) {
      throw new Error("No readable text found in the uploaded PDF.");
    }
    return rawText;
  } finally {
    await parser.destroy();
  }
};

export const parseProblemsFromText = (text) => {
  const raw = asString(text || "");
  if (!raw.trim()) {
    return {
      problems: [],
      meta: { totalDetected: 0, accepted: 0, pagesScanned: 0, pagesSkipped: 0 },
    };
  }

  const pages = splitRawTextIntoPages(raw);
  const problems = [];
  let detectedCandidates = 0;
  let pagesSkipped = 0;

  pages.forEach((pageText, index) => {
    const cleanText = cleanPdfPageText(pageText);
    if (!cleanText) {
      pagesSkipped += 1;
      return;
    }

    if (isLikelyAdPage(cleanText)) {
      pagesSkipped += 1;
      return;
    }

    const pageNumber = index + 1;
    const candidates = extractProblemCandidatesFromPage(cleanText, pageNumber);
    detectedCandidates += candidates.length;

    candidates.forEach((candidate) => {
      const parsed = parseProblemSegment(candidate, {
        pageNumber,
        category: candidate.category,
      });
      if (!parsed) return;

      const sanitized = sanitizeParsedProblem(parsed);
      const normalized = ensureExactProblemShape(sanitized);
      if (!isValidParsedProblem(normalized)) return;

      const starter = buildStarterCode(normalized);
      CODE_LANG_KEYS.forEach((language) => {
        if (!normalized.starterCode[language]) {
          normalized.starterCode[language] = starter[language];
        }
      });

      normalized.referenceSolution = buildReferenceSolution(
        normalized,
        normalized.referenceSolution,
      );

      problems.push(normalized);
    });
  });

  return {
    problems,
    meta: {
      totalDetected: detectedCandidates,
      accepted: problems.length,
      pagesScanned: pages.length,
      pagesSkipped,
    },
  };
};

export const parseProblemsFromPdfBuffer = async (buffer) => {
  const text = await extractTextFromPdfBuffer(buffer);
  return parseProblemsFromText(text);
};

export const validateParsedProblemShape = (problem) =>
  validateParsedProblem(ensureExactProblemShape(problem));
