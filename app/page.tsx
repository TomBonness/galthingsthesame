"use client";

import React, { useState, useEffect } from "react";
import QuestionSection, { QUESTIONS } from "@/components/QuestionSection";
import GaltonBoard from "@/components/GaltonBoard";
import FooterExplanation from "@/components/FooterExplanation";

export default function Home() {
  const [history, setHistory] = useState<number[][]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("galton_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
  }, []);

  const updateHistory = (newHistory: number[][]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("galton_history", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Error writing to localStorage:", e);
    }
  };

  const handleAnswer = (choice: number) => {
    if (isAnimating || currentStep >= QUESTIONS.length) return;
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);
    // Increment local step. The animation is triggered by answers length in GaltonBoard.
    setCurrentStep(newAnswers.length);
  };

  const handleAnimationComplete = () => {
    const newHistory = [...history, answers];
    updateHistory(newHistory);
  };

  const handleReset = () => {
    setAnswers([]);
    setCurrentStep(0);
    setIsAnimating(false);
  };

  const handleSimulate = () => {
    if (isAnimating) return;

    // Calculate current empirical probabilities with Laplace smoothing
    const probs = Array(10).fill(0.5);
    if (history.length > 0) {
      const counts = Array(10).fill(0);
      history.forEach((path) => {
        path.forEach((choice, idx) => {
          if (idx < 10) {
            counts[idx] += choice;
          }
        });
      });
      for (let i = 0; i < 10; i++) {
        probs[i] = (counts[i] + 1) / (history.length + 2);
      }
    }

    // Generate 500 runs based on these probabilities
    const newRuns: number[][] = [];
    for (let r = 0; r < 500; r++) {
      const run: number[] = [];
      for (let i = 0; i < 10; i++) {
        run.push(Math.random() < probs[i] ? 1 : 0);
      }
      newRuns.push(run);
    }

    const updated = [...history, ...newRuns];
    updateHistory(updated);
  };

  const handleClearHistory = () => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to clear all history? This will reset statistical distribution data.")) {
      updateHistory([]);
      handleReset();
    }
  };

  // SSR fallback
  if (!mounted) {
    return (
      <div className="min-h-screen bg-swiss-bg text-swiss-text flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        Loading Experiment State...
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between bg-swiss-bg text-swiss-text selection:bg-swiss-red selection:text-white">
      {/* Page Header */}
      <header className="w-full border-b border-swiss-text p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 items-baseline">
        <div className="lg:col-span-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase leading-none">
            Experiment No. 42 // The Galton Decision-Tree
          </h1>
          <h2 className="text-xs font-bold tracking-widest text-swiss-red uppercase mt-2">
            An Inquiry Into Subjective Choice And Mathematical Certainty
          </h2>
        </div>
        <div className="lg:col-span-4 lg:text-right font-mono text-[10px] uppercase tracking-widest text-swiss-text/50">
          <span>Swiss Typographic Grid System v1.0</span>
        </div>
      </header>

      {/* Main Interactive Grid */}
      <div className="flex-grow max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 border-b border-swiss-text divide-y lg:divide-y-0 lg:divide-x divide-swiss-text">
        {/* Left Column: Input / Questions */}
        <section className="lg:col-span-5 flex flex-col justify-between bg-swiss-bg">
          <QuestionSection
            currentStep={currentStep}
            answers={answers}
            onAnswer={handleAnswer}
            isAnimating={isAnimating}
            onReset={handleReset}
            onSimulate={handleSimulate}
            onClearHistory={handleClearHistory}
            totalHistoryCount={history.length}
          />
        </section>

        {/* Right Column: Visualization / Board & Stats */}
        <section className="lg:col-span-7 flex flex-col justify-center items-center bg-swiss-bg border-swiss-text">
          <GaltonBoard
            answers={answers}
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
            onAnimationComplete={handleAnimationComplete}
            history={history}
          />
        </section>
      </div>

      {/* Footer / Math & Hypothesis Grid */}
      <FooterExplanation />
    </main>
  );
}