"use client";
import { useState } from "react";
import { timeline } from "@/data/learning";

export default function LearningPage() {
  const [answer, setAnswer] = useState("");
  const options: [string, boolean][] = [["Weak positive", false], ["Strong negative", true], ["No relationship", false]];
  return (
    <section>
      <h1>Learning Center</h1>
      <p className="sub">History, formulas and practice.</p>
      <div className="tl">{timeline.map(([t, d]) => <div className="card" key={t}><b>{t}</b><p style={{ margin: "6px 0 0" }}>{d}</p></div>)}</div>
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h2>Regression formulas</h2>
          <ul className="steps" style={{ fontSize: 13 }}><li>b = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²</li><li>a = ȳ − b·x̄</li><li>r = Σ(x−x̄)(y−ȳ) / √(Σ(x−x̄)²·Σ(y−ȳ)²)</li><li>R² = r²</li></ul>
          <p className="mut">Worked example: points (1,2), (2,4), (3,5). x̄=2, ȳ=3.667, Sxy=3, Sxx=2, so b=1.5, a=0.667.</p></div>
        <div className="card"><h2>Z-test formulas</h2>
          <ul className="steps" style={{ fontSize: 13 }}><li>Z = (x̄ − μ₀) / (σ/√n)</li><li>Reject H₀ if Z is in the rejection region, or p ≤ α</li><li>Two-tailed α=0.05: critical Z = ±1.96</li></ul>
          <p className="mut">Worked example: x̄=52, μ₀=50, σ=8, n=64 gives SE=1, Z=2, so reject at α=0.05 (two-tailed).</p></div>
        <div className="card full"><h2>Practice</h2><p>If r = −0.82, how would you describe the relationship?</p>
          <div className="row">{options.map(([t, ok]) => <button key={t} className="btn g" onClick={() => setAnswer(ok ? "Correct. |r| = 0.82 is strong, and the sign is negative." : "Not quite. Look at the size of |r| and its sign.")}>{t}</button>)}</div>
          <p role="status">{answer}</p></div>
      </div>
    </section>
  );
}
