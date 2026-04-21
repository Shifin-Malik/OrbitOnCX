import React, { useState } from "react";
import { FaDownload, FaEye, FaFilePdf, FaTimes } from "react-icons/fa";

const SUPPORTED_STRUCTURE = [
  "Quiz title",
  "Description",
  "Difficulty sections: Easy / Medium / Advanced",
  "Numbered questions",
  "A/B/C/D options",
  "Difficulty line",
  "Answer line",
  "Explanation line",
];

const SAMPLE_QUIZ_TEXT = `Title: JavaScript Mastery MCQ Quiz
Description: A comprehensive test covering core JavaScript concepts...

Easy Questions
1. What will the expression typeof NaN return in JavaScript?
A. "number"
B. "NaN"
C. "undefined"
D. "object"
Difficulty: Easy
Answer: A. "number"
Explanation: Despite standing for "Not-A-Number", NaN is technically classified as a numeric data type...`;

const QuizPdfFormatGuide = () => {
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  return (
    <>
      <div className="bg-[var(--color-background-soft)] p-5 rounded-[1.5rem] border border-[var(--border-color-primary)] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[var(--color-primary)] text-[9px] font-black uppercase tracking-widest">
              Supported Quiz PDF Format
            </p>
            <p className="text-[11px] text-[var(--text-color-secondary)]">
              Upload only structured quiz PDFs that follow the pattern below so parsing remains accurate.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/assets/sample-quiz-format.pdf"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] text-[var(--text-color-primary)] text-[9px] font-black uppercase tracking-widest hover:border-[var(--color-primary)] transition-all"
            >
              <FaDownload size={10} />
              Download Sample PDF
            </a>
            <button
              type="button"
              onClick={() => setIsExampleOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[var(--color-primary-dark)] transition-all"
            >
              <FaEye size={10} />
              View Example
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-color-muted)] mb-2">
              Accepted Structure
            </p>
            <ul className="space-y-1.5">
              {SUPPORTED_STRUCTURE.map((item) => (
                <li
                  key={item}
                  className="text-[10px] text-[var(--text-color-secondary)] font-medium flex items-start gap-2"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--color-background-elevated)] border border-[var(--border-color-primary)] rounded-xl p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-color-muted)] mb-2">
              Sample Preview Card
            </p>
            <div className="rounded-lg border border-[var(--border-color-secondary)] bg-[var(--color-background-soft)] p-3">
              <pre className="text-[10px] leading-relaxed text-[var(--text-color-secondary)] whitespace-pre-wrap font-mono">
                {SAMPLE_QUIZ_TEXT}
              </pre>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3">
          <p className="text-[10px] font-bold text-amber-700">
            If your PDF does not follow this structure, some questions may be skipped during parsing.
          </p>
        </div>
      </div>

      {isExampleOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[var(--color-background-soft)] border border-[var(--border-color-primary)] rounded-[1.5rem] shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color-primary)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center">
                  <FaFilePdf size={12} />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-color-primary)]">
                  Quiz PDF Example
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExampleOpen(false)}
                className="text-[var(--text-color-muted)] hover:text-[var(--color-danger)] transition-colors"
                aria-label="Close example modal"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-5 max-h-[68vh] overflow-y-auto">
              <pre className="text-[11px] leading-relaxed text-[var(--text-color-secondary)] whitespace-pre-wrap font-mono">
                {SAMPLE_QUIZ_TEXT}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default QuizPdfFormatGuide;
