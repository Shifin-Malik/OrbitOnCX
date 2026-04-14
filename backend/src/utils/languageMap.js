export const JUDGE0_LANGUAGE_MAP = Object.freeze({
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  php: 68,
});

export const SUPPORTED_LANGUAGES = Object.freeze(
  Object.keys(JUDGE0_LANGUAGE_MAP),
);

export const isSupportedLanguage = (language) =>
  typeof language === "string" &&
  Object.prototype.hasOwnProperty.call(JUDGE0_LANGUAGE_MAP, language);

export const getJudge0LanguageId = (language) => JUDGE0_LANGUAGE_MAP[language];
