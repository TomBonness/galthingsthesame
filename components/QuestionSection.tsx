"use client";

import React, { useEffect } from "react";

export interface Question {
  id: number;
  left: string;
  right: string;
  leftLabel: string;
  rightLabel: string;
  category: string;
}

export const QUESTIONS: Question[] = [
  { id: 1, left: "COFFEE", right: "TEA", leftLabel: "Energy", rightLabel: "Calm", category: "Stimulant" },
  { id: 2, left: "MORNING", right: "NIGHT", leftLabel: "Sunrise", rightLabel: "Midnight", category: "Diurnal" },
  { id: 3, left: "CURVED", right: "STRAIGHT", leftLabel: "Organic", rightLabel: "Linear", category: "Geometry" },
  { id: 4, left: "NOISE", right: "SILENCE", leftLabel: "Activity", rightLabel: "Solitude", category: "Acoustic" },
  { id: 5, left: "CITIES", right: "FORESTS", leftLabel: "Urban", rightLabel: "Wild", category: "Habitat" },
  { id: 6, left: "LOGIC", right: "INSTINCT", leftLabel: "Analysis", rightLabel: "Intuition", category: "Cognition" },
  { id: 7, left: "ANALOG", right: "DIGITAL", leftLabel: "Tactile", rightLabel: "Virtual", category: "Medium" },
  { id: 8, left: "CHAOS", right: "ORDER", leftLabel: "Entropy", rightLabel: "Structure", category: "System" },
  { id: 9, left: "ABSTRACT", right: "CONCRETE", leftLabel: "Theory", rightLabel: "Reality", category: "Concept" },
  { id: 10, left: "FUTURE", right: "PAST", leftLabel: "Hope", rightLabel: "Memory", category: "Time" },
];

interface QuestionSectionProps {
  currentStep: number; // 0 to 9 for questions, 10 for completed
  answers: number[]; // array of 0 (left) or 1 (right)
  onAnswer: (choice: number) => void;
  isAnimating: boolean;
  onReset: () => void;
  onClearHistory: () => void;
  totalHistoryCount: number;
}
export default function QuestionSection({
  currentStep,
  answers,
  onAnswer,
  isAnimating,
  onReset,
  onClearHistory,
  totalHistoryCount,
}: QuestionSectionProps) {
  useEffect(() => {
    if (currentStep >= QUESTIONS.length || isAnimating) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        onAnswer(0);
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        onAnswer(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, onAnswer, isAnimating]);

  const activeQuestion = QUESTIONS[currentStep];

  return (
    <div className="flex flex-col justify-between h-full min-h-[400px] p-6 lg:p-8 font-sans">
      {/* Step counter */}
      <div className="flex justify-between items-baseline hairline-b pb-4 mb-6">
        <span className="text-sm font-bold tracking-widest text-swiss-text/60">
          {currentStep < QUESTIONS.length
            ? `DECISION ${String(currentStep + 1).padStart(2, "0")} // 10`
            : "EXPERIMENT COMPLETE"}
        </span>
        <span className="text-xs font-mono tracking-wider text-swiss-text/40">
          {currentStep < QUESTIONS.length ? activeQuestion.category.toUpperCase() : "ANALYSIS"}
        </span>
      </div>

      {currentStep < QUESTIONS.length ? (
        <div className="flex-grow flex flex-col justify-center my-6">
          {/* Main Question Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center text-center relative">
            {/* Left option */}
            <button
              onClick={() => !isAnimating && onAnswer(0)}
              disabled={isAnimating}
              className="group flex flex-col items-center justify-center p-4 transition-all duration-150 focus:outline-none"
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-swiss-text group-hover:text-swiss-red group-focus:text-swiss-red transition-colors duration-150">
                {activeQuestion.left}
              </span>
              <span className="mt-2 text-xs uppercase tracking-widest text-swiss-text/40 group-hover:text-swiss-red/60 transition-colors duration-150">
                {activeQuestion.leftLabel} (A / ◄)
              </span>
            </button>
            {/* Separator */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-swiss-text/20 -translate-x-1/2 hidden sm:block" />
            <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-swiss-text/20 -translate-y-1/2 sm:hidden" />
            {/* Right option */}
            <button
              onClick={() => !isAnimating && onAnswer(1)}
              disabled={isAnimating}
              className="group flex flex-col items-center justify-center p-4 transition-all duration-150 focus:outline-none"
            >
              <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-swiss-text group-hover:text-swiss-red group-focus:text-swiss-red transition-colors duration-150">
                {activeQuestion.right}
              </span>
              <span className="mt-2 text-xs uppercase tracking-widest text-swiss-text/40 group-hover:text-swiss-red/60 transition-colors duration-150">
                (► / D) {activeQuestion.rightLabel}
              </span>
            </button>
          </div>

          <div className="mt-12 text-center text-xs tracking-wider text-swiss-text/40 uppercase font-mono">
            {isAnimating ? (
              <span className="text-swiss-red font-bold animate-pulse">Token in motion down the board...</span>
            ) : (
              <div className="flex flex-col gap-1 items-center">
                <span className="text-swiss-text/60 font-semibold animate-pulse">Awaiting input...</span>
                <span>Use keyboard keys A / D or Arrow Left / Right to decide</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-center my-6">
          <h3 className="text-2xl font-bold tracking-tight text-swiss-text mb-4">
            YOUR DECISION PATH:
          </h3>
          <div className="flex flex-wrap gap-2 mb-6 font-mono text-xs uppercase tracking-wider">
            {answers.map((ans, idx) => {
              const q = QUESTIONS[idx];
              const val = ans === 0 ? q.left : q.right;
              return (
                <span
                  key={idx}
                  className="px-2 py-1 bg-swiss-text text-swiss-bg font-semibold rounded-none inline-block"
                >
                  {val}
                </span>
              );
            })}
          </div>

          <p className="text-sm text-swiss-text/75 mb-8 leading-relaxed max-w-md">
            Your choices have guided the token to Bin #{answers.reduce((a, b) => a + b, 0)}. Even though your responses are subjective, they constitute a series of Bernoulli trials. Over many runs, the aggregate result forms a Gaussian normal distribution.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReset}
              disabled={isAnimating}
              className="flex-1 py-3 px-6 bg-swiss-red hover:bg-swiss-red/90 text-white font-bold tracking-widest text-xs uppercase transition-colors duration-150 focus:outline-none rounded-none"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Control info / history metadata */}
      <div className="hairline-t pt-4 mt-6 flex flex-wrap justify-between items-center text-xs uppercase tracking-widest text-swiss-text/50">
        <span>History: {totalHistoryCount} total runs</span>
        {totalHistoryCount > 0 && (
          <button
            onClick={onClearHistory}
            className="hover:text-swiss-red transition-colors duration-150 focus:outline-none font-bold underline decoration-dotted"
          >
            Clear History
          </button>
        )}
      </div>
    </div>
  );
}