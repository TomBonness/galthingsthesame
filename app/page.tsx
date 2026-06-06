"use client";

import React, { useState, useEffect } from "react";
import QuestionSection, { QUESTIONS } from "@/components/QuestionSection";
import GaltonBoard from "@/components/GaltonBoard";
import FooterExplanation from "@/components/FooterExplanation";

const API_ENDPOINT = "https://qfxhnb76j8.execute-api.us-east-1.amazonaws.com";

export default function Home() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Group statistics states
  const [totalRuns, setTotalRuns] = useState<number>(0);
  const [binCounts, setBinCounts] = useState<number[]>(Array(11).fill(0));
  const [questionProbs, setQuestionProbs] = useState<number[]>(Array(10).fill(0.5));

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await fetch(API_ENDPOINT);
        if (res.ok) {
          const data = await res.json();
          setTotalRuns(data.totalRuns ?? 0);
          setBinCounts(data.binCounts ?? Array(11).fill(0));
          setQuestionProbs(data.questionProbs ?? Array(10).fill(0.5));
        }
      } catch (e) {
        console.error("Error fetching group stats:", e);
      }
    };
    fetchStats();
  }, []);
  const handleAnswer = (choice: number) => {
    if (isAnimating || currentStep >= QUESTIONS.length) return;
    const newAnswers = [...answers, choice];
    setAnswers(newAnswers);
    // Increment local step. The animation is triggered by answers length in GaltonBoard.
    setCurrentStep(newAnswers.length);
  };

  const handleAnimationComplete = async () => {
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotalRuns(data.totalRuns ?? 0);
        setBinCounts(data.binCounts ?? Array(11).fill(0));
        setQuestionProbs(data.questionProbs ?? Array(10).fill(0.5));
      }
    } catch (e) {
      console.error("Error posting user answers:", e);
    }
  };

  const handleReset = () => {
    setAnswers([]);
    setCurrentStep(0);
    setIsAnimating(false);
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
            Experiment No. 03 // The Galton Decision-Tree
          </h1>
          <h2 className="text-xs font-bold tracking-widest text-swiss-red uppercase mt-2">
            An Inquiry Into Subjective Choice And Mathematical Certainty
          </h2>
        </div>
        <div className="lg:col-span-4 lg:text-right font-mono text-[10px] uppercase tracking-widest text-swiss-text/50">
          <span>Decision Trajectory Visualizer v1.0</span>
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
            onClearHistory={async () => {
              // Local reset only since simulation is disabled
              handleReset();
            }}
            totalHistoryCount={totalRuns}
          />
        </section>

        {/* Right Column: Visualization / Board & Stats */}
        <section className="lg:col-span-7 flex flex-col justify-center items-center bg-swiss-bg border-swiss-text">
          <GaltonBoard
            answers={answers}
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
            onAnimationComplete={handleAnimationComplete}
            totalRuns={totalRuns}
            binCounts={binCounts}
            questionProbs={questionProbs}
          />
        </section>
      </div>

      {/* Footer / Math & Hypothesis Grid */}
      <FooterExplanation />
    </main>
  );
}