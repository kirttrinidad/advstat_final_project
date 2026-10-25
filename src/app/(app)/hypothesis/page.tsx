"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { load, remove } from "@/lib/storage";
import { apiRequest } from "@/lib/api";
import { f, Tail, zTest } from "@/lib/stats";
import NormalCurve from "@/components/NormalCurve";
import StatRow from "@/components/StatRow";

interface Params { mu: number; xb: number; sg: number; n: number; al: number; tl: Tail }
interface Pending { type: string; input: Params }

export default function HypothesisPage() {
  const { user } = useAuth();
  const [v, setV] = useState({ mu: "50", xb: "52.3", sg: "8", n: "40", al: "0.05", tl: "two" as Tail });
  const [params, setParams] = useState<Params>({ mu: 50, xb: 52.3, sg: 8, n: 40, al: 0.05, tl: "two" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof typeof v, val: string) => setV({ ...v, [k]: val });

  useEffect(() => {
    const o = load<Pending | null>("sv_open", null);
    if (o && o.type === "Z-test") {
      const i = o.input;
      setV({ mu: String(i.mu), xb: String(i.xb), sg: String(i.sg), n: String(i.n), al: i.al.toFixed(i.al < 0.01 ? 3 : 2), tl: i.tl });
      setParams(i);
      remove("sv_open");
    }
  }, []);

  function run() {
    const mu = +v.mu, xb = +v.xb, sg = +v.sg, n = +v.n;
    if ([v.mu, v.xb, v.sg, v.n].some((s) => s === "") || !(sg > 0) || !Number.isInteger(n) || n < 2) {
      setError("Enter numeric values, σ > 0 and a whole number n ≥ 2."); return;
    }
    setError(""); setSaved(false);
    setParams({ mu, xb, sg, n, al: +v.al, tl: v.tl });
  }
  const r = zTest(params.mu, params.xb, params.sg, params.n, params.al, params.tl);
  const crit = params.tl === "two" ? "±" + f(r.crit, 3) : f(r.crit, 3);
  const decision = r.reject ? "Reject H₀" : "Fail to reject H₀";
  const onSave = async () => {
    if (!user) return;
    setSaveError("");
    const title = `Z-test μ${r.sym}${f(params.mu)}`;
    try {
      await apiRequest("/api/analyses", {
        method: "POST",
        body: JSON.stringify({
          type: "Z-test", title, inputData: { ...params },
          results: { standardError: r.se, z: r.z, p: r.p, criticalValue: r.crit, reject: r.reject },
        }),
      });
      setSaved(true);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save analysis."); }
  };

  return (
    <section>
      <h1>Hypothesis Testing</h1>
      <p className="sub">One-sample Z-test (σ known).</p>
      <div className="grid">
        <div className="card">
          <h2>Setup</h2>
          <div className="row">
            <div><label htmlFor="mu">μ₀ (null mean)</label><input id="mu" type="number" step="any" value={v.mu} onChange={(e) => set("mu", e.target.value)} /></div>
            <div><label htmlFor="xb">Sample mean x̄</label><input id="xb" type="number" step="any" value={v.xb} onChange={(e) => set("xb", e.target.value)} /></div>
          </div>
          <div className="row">
            <div><label htmlFor="sg">Population σ</label><input id="sg" type="number" step="any" value={v.sg} onChange={(e) => set("sg", e.target.value)} /></div>
            <div><label htmlFor="nn">Sample size n</label><input id="nn" type="number" step="1" value={v.n} onChange={(e) => set("n", e.target.value)} /></div>
          </div>
          <div className="row">
            <div><label htmlFor="al">Significance level α</label>
              <select id="al" value={v.al} onChange={(e) => set("al", e.target.value)}>{["0.10", "0.05", "0.01", "0.001"].map((a) => <option key={a}>{a}</option>)}</select></div>
            <div><label htmlFor="tl">Alternative H₁</label>
              <select id="tl" value={v.tl} onChange={(e) => set("tl", e.target.value)}>
                <option value="two">Two-tailed (μ ≠ μ₀)</option><option value="right">Right-tailed (μ &gt; μ₀)</option><option value="left">Left-tailed (μ &lt; μ₀)</option>
              </select></div>
          </div>
          <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={run}>Run test</button></div>
          <div className="err">{error}</div>
          <p className="mut" style={{ fontSize: 12 }}>Valid when σ is known and the population is normal or n ≥ 30.</p>
        </div>
        <div className="card">
          <h2>Results</h2>
          <StatRow label="H₀">μ = {f(params.mu)}</StatRow>
          <StatRow label="H₁">μ {r.sym} {f(params.mu)}</StatRow>
          <StatRow label="Standard error σ/√n">{f(r.se)}</StatRow>
          <StatRow label="Z statistic">{f(r.z, 3)}</StatRow>
          <StatRow label={`Critical Z (α = ${params.al})`}>{crit}</StatRow>
          <StatRow label="p-value">{r.p < 1e-4 ? "< 0.0001" : f(r.p, 4)}</StatRow>
          <p><span className={"pill " + (r.reject ? "rej" : "fail")}>{decision}</span></p>
          <p>{r.reject
            ? `Z = ${f(r.z, 3)} is inside the rejection region and p ≤ α, so the sample gives enough evidence that μ ${r.sym} ${f(params.mu)}.`
            : `Z = ${f(r.z, 3)} is outside the rejection region and p > α, so the sample does not give enough evidence that μ ${r.sym} ${f(params.mu)}.`}</p>
          {params.n < 30 && <p className="err">n &lt; 30: only valid if the population is normal.</p>}
          <ul className="steps"><li>Z=(x̄−μ₀)/(σ/√n)=({f(params.xb)}−{f(params.mu)})/{f(r.se)}={f(r.z, 3)}</li></ul>
          <button className="btn" style={{ marginTop: 12 }} onClick={onSave} disabled={saved}>{saved ? "Saved" : "Save analysis"}</button>
          <div className="err" role="alert">{saveError}</div>
        </div>
        <div className="card full"><h2>Distribution</h2><NormalCurve z={r.z} crit={r.crit} tail={params.tl} /></div>
      </div>
    </section>
  );
}
