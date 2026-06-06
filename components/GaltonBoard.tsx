"use client";

import React, { useState, useEffect, useRef } from "react";

interface GaltonBoardProps {
  answers: number[];
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  onAnimationComplete: () => void;
  totalRuns: number;
  binCounts: number[];
  questionProbs: number[];
}
const getPegX = (r: number, c: number) => {
  const deltaX = 36;
  const W = 600;
  return W / 2 - (r * deltaX) / 2 + c * deltaX;
};

const getPegY = (r: number) => {
  const deltaY = 36;
  const startY = 40;
  return startY + r * deltaY;
};

const gaussianPDF = (x: number, mean: number, variance: number) => {
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  const exponent = -Math.pow(x - mean, 2) / (2 * variance);
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};

export default function GaltonBoard({
  answers,
  isAnimating,
  setIsAnimating,
  onAnimationComplete,
  totalRuns,
  binCounts,
  questionProbs,
}: GaltonBoardProps) {
  const [tokenPos, setTokenPos] = useState({ x: getPegX(0, 0), y: getPegY(0) });
  const [currentLevel, setCurrentLevel] = useState(0);
  const [flashingPeg, setFlashingPeg] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const prevAnswersLength = useRef(0);

  // Reset or step animation
  useEffect(() => {
    const L = answers.length;

    // Handle reset
    if (L === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setTokenPos({ x: getPegX(0, 0), y: getPegY(0) });
      setCurrentLevel(0);
      setFlashingPeg(null);
      prevAnswersLength.current = 0;
      setIsAnimating(false);
      return;
    }

    // If an answer was added
    if (L > prevAnswersLength.current) {
      const stepToAnimate = L - 1; // e.g. from stepToAnimate to stepToAnimate + 1
      prevAnswersLength.current = L;

      // Start position (L-1, sum of first L-1 answers)
      const prevSum = answers.slice(0, stepToAnimate).reduce((a, b) => a + b, 0);
      const nextSum = prevSum + answers[stepToAnimate];

      const startX = getPegX(stepToAnimate, prevSum);
      const startY = getPegY(stepToAnimate);
      const endX = getPegX(stepToAnimate + 1, nextSum);
      const endY = getPegY(stepToAnimate + 1);

      setIsAnimating(true);

      const duration = 300; // ms per bounce
      let startTime: number | null = null;

      const animateBounce = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Linear interpolation for X
        const x = startX + (endX - startX) * progress;

        // Linear + parabolic bounce for Y
        const bounceHeight = 10; // bounce over the peg
        const y = startY + (endY - startY) * progress - bounceHeight * Math.sin(Math.PI * progress);

        setTokenPos({ x, y });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateBounce);
        } else {
          // Animation finished for this step
          setTokenPos({ x: endX, y: endY });
          setCurrentLevel(L);

          // Flash the peg that was hit
          if (L < 10) {
            setFlashingPeg(`${L}-${nextSum}`);
            setTimeout(() => setFlashingPeg(null), 150);
          }

          setIsAnimating(false);

          // If this was the last question, signal completion
          if (L === 10) {
            onAnimationComplete();
          }
        }
      };

      animationRef.current = requestAnimationFrame(animateBounce);
    }
  }, [answers, setIsAnimating, onAnimationComplete]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate empirical probabilities p_i
  const probs = questionProbs && questionProbs.length === 10 ? questionProbs : Array(10).fill(0.5);
  const mean = probs.reduce((a, b) => a + b, 0);
  const variance = probs.reduce((a, b) => a + b * (1 - b), 0);
  // Default bin counts if not provided
  const binCountsToUse = binCounts && binCounts.length === 11 ? binCounts : Array(11).fill(0);
  const maxCount = Math.max(...binCountsToUse);
  const histogramBaseline = 570;
  const histogramMaxHeight = 110;
  const scaleY = histogramMaxHeight / Math.max(5, maxCount);
  // Empirical Gaussian Curve Path
  const startX = 80;
  const endX = 520;
  const step = 2;
  const curvePoints: string[] = [];
  const M_effective = totalRuns > 0 ? totalRuns : 100; // use 100 as dummy for shape display

  for (let x = startX; x <= endX; x += step) {
    const v = (x - 120) / 36;
    const pdfVal = gaussianPDF(v, mean, variance);
    const height = pdfVal * M_effective * scaleY;
    const y = histogramBaseline - height;
    const clampedY = Math.min(histogramBaseline, Math.max(histogramBaseline - histogramMaxHeight, y));
    if (x === startX) {
      curvePoints.push(`M ${x} ${clampedY}`);
    } else {
      curvePoints.push(`L ${x} ${clampedY}`);
    }
  }
  const gaussianPathString = curvePoints.join(" ");

  // Render pegs
  const pegs: React.ReactNode[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c <= r; c++) {
      const x = getPegX(r, c);
      const y = getPegY(r);
      const isFlashing = flashingPeg === `${r}-${c}`;

      // Check if this peg is in the current active path
      const currentPathSum = answers.slice(0, r).reduce((a, b) => a + b, 0);
      const isActive = r <= answers.length && c === currentPathSum;

      pegs.push(
        <circle
          key={`peg-${r}-${c}`}
          cx={x}
          cy={y}
          r={isFlashing ? 5.5 : isActive ? 4 : 2.5}
          className={`transition-all duration-150 ${
            isFlashing
              ? "fill-swiss-red"
              : isActive
              ? "fill-swiss-red/60"
              : "fill-swiss-text"
          }`}
        />
      );
    }
  }

  // Draw current path line
  const activePathPoints: string[] = [];
  for (let r = 0; r <= answers.length; r++) {
    const sum = answers.slice(0, r).reduce((a, b) => a + b, 0);
    activePathPoints.push(`${getPegX(r, sum)},${getPegY(r)}`);
  }
  const activePathString = activePathPoints.join(" ");

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 bg-swiss-bg">
      <div className="w-full max-w-[600px] border border-swiss-text bg-swiss-bg p-4 relative shadow-[4px_4px_0px_0px_#111111]">
        {/* Board Header details */}
        <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-mono text-swiss-text/40 mb-2 border-b border-swiss-text/10 pb-1">
          <span>BOARD MODEL: GT-10-CLT</span>
          <span>SCALE: 1:1</span>
        </div>

        {/* SVG Drawing */}
        <svg
          viewBox="0 0 600 620"
          className="w-full h-auto bg-swiss-bg select-none"
        >
          {/* Grid lines (light background lines for Swiss aesthetics) */}
          <line x1="120" y1="40" x2="120" y2="570" stroke="#111111" strokeOpacity="0.05" strokeWidth="1" />
          <line x1="300" y1="40" x2="300" y2="570" stroke="#111111" strokeOpacity="0.05" strokeWidth="1" />
          <line x1="480" y1="40" x2="480" y2="570" stroke="#111111" strokeOpacity="0.05" strokeWidth="1" />

          {/* Active path trail */}
          {answers.length > 0 && (
            <polyline
              points={activePathString}
              fill="none"
              stroke="#D81E05"
              strokeWidth="2.5"
              strokeDasharray="none"
              className="opacity-80"
            />
          )}

          {/* Peg board pegs */}
          {pegs}

          {/* Bin dividers */}
          {Array.from({ length: 12 }).map((_, idx) => {
            const x = 102 + idx * 36;
            return (
              <line
                key={`divider-${idx}`}
                x1={x}
                y1="375"
                x2={x}
                y2="440"
                stroke="#111111"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Bin bottom plate */}
          <line
            x1="102"
            y1="440"
            x2="498"
            y2="440"
            stroke="#111111"
            strokeWidth="2"
          />

          {/* Histogram Bars */}
          {binCountsToUse.map((count, idx) => {
            const barWidth = 20;
            const x = 120 + idx * 36 - barWidth / 2;
            const barHeight = count * scaleY;
            const y = histogramBaseline - barHeight;

            return (
              <g key={`bar-${idx}`} className="group">
                {/* Histogram bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  className="fill-swiss-text transition-all duration-300 hover:fill-swiss-red"
                />

                {/* Count indicator on hover or if count > 0 */}
                {count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="font-mono text-[9px] font-bold fill-swiss-text"
                  >
                    {count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Histogram Baseline */}
          <line
            x1="80"
            y1={histogramBaseline}
            x2="520"
            y2={histogramBaseline}
            stroke="#111111"
            strokeWidth="1.5"
          />

          {/* Normal Distribution Overlay (Gaussian Curve) */}
          <path
            d={gaussianPathString}
            fill="none"
            stroke="#D81E05"
            strokeWidth="2"
            strokeDasharray={totalRuns === 0 ? "4 4" : "none"}
            className="transition-all duration-300"
          />

          {/* Labels for bins */}
          {Array.from({ length: 11 }).map((_, idx) => {
            const x = 120 + idx * 36;
            return (
              <text
                key={`label-${idx}`}
                x={x}
                y={histogramBaseline + 18}
                textAnchor="middle"
                className="font-mono text-[10px] font-bold fill-swiss-text"
              >
                {idx}
              </text>
            );
          })}

          {/* Live falling token */}
          {isAnimating && (
            <circle
              cx={tokenPos.x}
              cy={tokenPos.y}
              r="6.5"
              className="fill-swiss-red filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
            />
          )}
        </svg>

        {/* Legend */}
        <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-mono text-swiss-text/50 mt-2 border-t border-swiss-text/10 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-swiss-red rounded-full inline-block" />
            <span>Active Token / Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-swiss-red border-dashed inline-block" />
            <span>Lindeberg-Feller Limit Curve</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2 bg-swiss-text inline-block" />
            <span>Bin Frequencies</span>
          </div>
        </div>
      </div>
    </div>
  );
}