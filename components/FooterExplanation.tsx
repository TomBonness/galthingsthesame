import React from "react";

export default function FooterExplanation() {
  return (
    <footer className="w-full border-t border-swiss-text mt-12 bg-swiss-bg">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-swiss-text">
        {/* Column 1: The Hypothesis */}
        <div className="p-8 font-sans">
          <div className="text-xs font-mono font-bold tracking-widest text-swiss-red mb-3">
            01 // THE HYPOTHESIS
          </div>
          <h4 className="text-xl font-extrabold tracking-tight mb-4 uppercase">
            Subjective Choice as a Random Process
          </h4>
          <p className="text-xs text-swiss-text/80 leading-relaxed text-justify uppercase font-medium">
            This experiment models human decision-making as a sequence of independent Bernoulli trials. Each subjective choice (e.g., Coffee vs. Tea) forces the token to drop left (0) or right (1). Although your personal decisions feel conscious, deliberate, and non-random, the aggregate result of many individuals or many trials shows a statistical pattern indistinguishable from objective physical chance.
          </p>
        </div>

        {/* Column 2: The CLT Math */}
        <div className="p-8 font-sans">
          <div className="text-xs font-mono font-bold tracking-widest text-swiss-red mb-3">
            02 // THE CLT MATH
          </div>
          <h4 className="text-xl font-extrabold tracking-tight mb-4 uppercase">
            Lindeberg-Feller CLT Convergence
          </h4>
          <p className="text-xs text-swiss-text/80 leading-relaxed text-justify uppercase font-medium">
            The classical Central Limit Theorem assumes identical distributions. However, since subjective preferences for Coffee vs. Tea differ from Analog vs. Digital, each decision step has a unique probability <span className="normal-case font-semibold text-swiss-red">p<sub>i</sub></span>. Under the Lindeberg-Feller CLT, as long as no single question dominates the variance, the sum of these independent, non-identical trials <span className="normal-case font-semibold">S<sub>n</sub> = ∑<sub>i=1</sub><sup>10</sup> X<sub>i</sub></span> still converges to a normal Gaussian distribution <span className="normal-case font-semibold text-swiss-red">N(μ, σ²)</span>.
          </p>
        </div>
        {/* Column 3: The Formula */}
        <div className="p-8 font-sans flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-swiss-red mb-3">
              03 // THE FORMULA
            </div>
            <h4 className="text-xl font-extrabold tracking-tight mb-4 uppercase">
              Mathematical Model
            </h4>
          </div>

          <div className="bg-swiss-text text-swiss-bg p-4 font-mono text-xs space-y-4 shadow-[2px_2px_0px_0px_#D81E05]">
            <div>
              <span className="text-swiss-red font-bold">EXPECTED MEAN:</span>
              <div className="mt-1.5 font-semibold text-xs flex items-center gap-1">
                μ = ∑<sub>i=1</sub><sup>10</sup> p<sub>i</sub>
              </div>
            </div>
            <div className="border-t border-swiss-bg/25 pt-3">
              <span className="text-swiss-red font-bold">EXPECTED VARIANCE:</span>
              <div className="mt-1.5 font-semibold text-xs flex items-center gap-1">
                σ² = ∑<sub>i=1</sub><sup>10</sup> p<sub>i</sub>(1 - p<sub>i</sub>)
              </div>
            </div>
            <div className="border-t border-swiss-bg/25 pt-3">
              <span className="text-swiss-red font-bold">LIMIT DISTRIBUTION:</span>
              <div className="mt-2 font-semibold text-xs flex items-center gap-2">
                <div className="flex flex-col items-center leading-none">
                  <span className="border-b border-swiss-bg pb-0.5">S<sub>n</sub> - μ</span>
                  <span className="pt-0.5">σ</span>
                </div>
                <span className="text-swiss-red font-bold">→</span>
                <span>N(0, 1)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-swiss-text p-4 text-center font-mono text-[9px] uppercase tracking-widest text-swiss-text/40">
        EXPERIMENT NO. 03 // HARNESSING ENTROPY // DESIGNED IN SWITZERLAND // EST. 2026
      </div>
    </footer>
  );
}