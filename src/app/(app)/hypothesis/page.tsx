"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { load, remove } from "@/lib/storage";
import { apiRequest } from "@/lib/api";
import { f, Tail, oneSampleTTest, twoSampleZTest, welchTTest, zTest } from "@/lib/stats";
import NormalCurve from "@/components/NormalCurve";
import StatRow from "@/components/StatRow";

type Family = "z" | "t";
type SampleTestType = "one" | "two";
interface FormValues { mu: string; xb: string; sg: string; n: string; x2b: string; s2g: string; n2: string; al: string; tl: Tail }
type TestParams =
  | { kind: "z"; mu: number; xb: number; sg: number; n: number; al: number; tl: Tail }
  | { kind: "two-z"; xb: number; sg: number; n: number; x2b: number; s2g: number; n2: number; al: number; tl: Tail }
  | { kind: "one-t"; mu: number; xb: number; sg: number; n: number; al: number; tl: Tail }
  | { kind: "two-t"; xb: number; sg: number; n: number; x2b: number; s2g: number; n2: number; al: number; tl: Tail };
interface Pending { type: string; input: Record<string, unknown> }

const initialValues: FormValues = {
  mu: "50", xb: "52.3", sg: "8", n: "40", x2b: "55", s2g: "10", n2: "35", al: "0.05", tl: "two",
};

function parseParams(v: FormValues, family: Family, sampleType: SampleTestType): { params: TestParams | null; error: string } {
  const required = sampleType === "one"
    ? [v.mu, v.xb, v.sg, v.n]
    : [v.xb, v.sg, v.n, v.x2b, v.s2g, v.n2];
  const numbers = required.map(Number);
  const alpha = Number(v.al);
  if (required.some((value) => value.trim() === "") || numbers.some((value) => !Number.isFinite(value))) {
    return { params: null, error: "Enter numeric values for every required input." };
  }
  if (!(alpha > 0 && alpha < 1)) return { params: null, error: "Significance level α must be between 0 and 1." };
  if (sampleType === "one") {
    const [mu, xb, sg, n] = numbers;
    if (!(sg > 0) || !Number.isInteger(n) || n < 2) {
      return { params: null, error: family === "z"
        ? "Enter numeric values, σ > 0 and a whole number n ≥ 2."
        : "Enter numeric values, s > 0 and a whole number n ≥ 2." };
    }
    return { params: family === "z"
      ? { kind: "z", mu, xb, sg, n, al: alpha, tl: v.tl }
      : { kind: "one-t", mu, xb, sg, n, al: alpha, tl: v.tl }, error: "" };
  }
  const [xb, sg, n, x2b, s2g, n2] = numbers;
  if (!(sg > 0) || !(s2g > 0) || !Number.isInteger(n) || n < 2 || !Number.isInteger(n2) || n2 < 2) {
    return { params: null, error: `Enter ${family === "z" ? "population" : "sample"} standard deviations > 0 and whole sample sizes n₁, n₂ ≥ 2.` };
  }
  return { params: family === "z"
    ? { kind: "two-z", xb, sg, n, x2b, s2g, n2, al: alpha, tl: v.tl }
    : { kind: "two-t", xb, sg, n, x2b, s2g, n2, al: alpha, tl: v.tl }, error: "" };
}

function restoredNumber(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export default function HypothesisPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family>("z");
  const [tType, setTType] = useState<SampleTestType>("one");
  const [v, setV] = useState<FormValues>(initialValues);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const parsed = parseParams(v, family, tType);
  const params = parsed.params;

  useEffect(() => {
    const o = load<Pending | null>("sv_open", null);
    if (!o) return;
    const input = o.input;
    if (o.type === "Z-test") {
      const tl = input.tl;
      if (tl === "two" || tl === "left" || tl === "right") {
        setFamily("z");
        setTType("one");
        setV({ ...initialValues, mu: restoredNumber(input, "mu"), xb: restoredNumber(input, "xb"), sg: restoredNumber(input, "sg"), n: restoredNumber(input, "n"), al: restoredNumber(input, "al"), tl });
        remove("sv_open");
      }
    } else if (o.type === "Two-sample Z-test") {
      const tl = input.tl;
      if (tl === "two" || tl === "left" || tl === "right") {
        setFamily("z");
        setTType("two");
        setV({ ...initialValues, xb: restoredNumber(input, "xb"), sg: restoredNumber(input, "sg"), n: restoredNumber(input, "n"), x2b: restoredNumber(input, "x2b"), s2g: restoredNumber(input, "s2g"), n2: restoredNumber(input, "n2"), al: restoredNumber(input, "al"), tl });
        remove("sv_open");
      }
    } else if (o.type === "One-sample T-test") {
      const tl = input.tl;
      if (tl === "two" || tl === "left" || tl === "right") {
        setFamily("t");
        setTType("one");
        setV({ ...initialValues, mu: restoredNumber(input, "mu"), xb: restoredNumber(input, "xb"), sg: restoredNumber(input, "sg"), n: restoredNumber(input, "n"), al: restoredNumber(input, "al"), tl });
        remove("sv_open");
      }
    } else if (o.type === "Welch two-sample T-test") {
      const tl = input.tl;
      if (tl === "two" || tl === "left" || tl === "right") {
        setFamily("t");
        setTType("two");
        setV({ ...initialValues, xb: restoredNumber(input, "xb"), sg: restoredNumber(input, "sg"), n: restoredNumber(input, "n"), x2b: restoredNumber(input, "x2b"), s2g: restoredNumber(input, "s2g"), n2: restoredNumber(input, "n2"), al: restoredNumber(input, "al"), tl });
        remove("sv_open");
      }
    }
  }, []);

  const update = (next: FormValues) => {
    setV(next);
    setError("");
    setSaved(false);
    const nextParams = parseParams(next, family, tType);
    if (!nextParams.params) setError(nextParams.error);
  };
  const set = (key: keyof FormValues, value: string) => update({ ...v, [key]: value });
  const changeFamily = (next: Family) => {
    setFamily(next);
    setError("");
    setSaved(false);
    const nextParams = parseParams(v, next, tType);
    if (!nextParams.params) setError(nextParams.error);
  };
  const changeTType = (next: SampleTestType) => {
    setTType(next);
    setError("");
    setSaved(false);
    const nextParams = parseParams(v, family, next);
    if (!nextParams.params) setError(nextParams.error);
  };
  const run = () => {
    setError(parsed.error);
    setSaved(false);
  };

  const onSave = async () => {
    if (!user || !params) return;
    setSaveError("");
    const result = params.kind === "z"
      ? { kind: "z" as const, ...zTest(params.mu, params.xb, params.sg, params.n, params.al, params.tl) }
      : params.kind === "two-z"
        ? { kind: "z" as const, ...twoSampleZTest(params.xb, params.sg, params.n, params.x2b, params.s2g, params.n2, params.al, params.tl) }
        : params.kind === "one-t"
          ? { kind: "t" as const, ...oneSampleTTest(params.mu, params.xb, params.sg, params.n, params.al, params.tl) }
          : { kind: "t" as const, ...welchTTest(params.xb, params.sg, params.n, params.x2b, params.s2g, params.n2, params.al, params.tl) };
    const type = params.kind === "z" ? "Z-test" : params.kind === "two-z" ? "Two-sample Z-test" : params.kind === "one-t" ? "One-sample T-test" : "Welch two-sample T-test";
    const title = params.kind === "two-t" || params.kind === "two-z"
      ? `${params.kind === "two-z" ? "Two-sample Z-test" : "Welch T-test"} x̄₁${result.sym}x̄₂`
      : `${type} μ${result.sym}${f(params.mu)}`;
    const results = result.kind === "z"
      ? { standardError: result.se, z: result.z, p: result.p, criticalValue: result.crit, reject: result.reject }
      : { standardError: result.se, t: result.t, degreesOfFreedom: result.df, p: result.p, criticalValue: result.crit, reject: result.reject };
    try {
      await apiRequest("/api/analyses", {
        method: "POST",
        body: JSON.stringify({ type, title, inputData: { ...params }, results }),
      });
      setSaved(true);
    } catch (reason) { setSaveError(reason instanceof Error ? reason.message : "Unable to save analysis."); }
  };

  const zResult = params?.kind === "z"
    ? zTest(params.mu, params.xb, params.sg, params.n, params.al, params.tl)
    : params?.kind === "two-z"
      ? twoSampleZTest(params.xb, params.sg, params.n, params.x2b, params.s2g, params.n2, params.al, params.tl)
      : null;
  const tResult = params?.kind === "one-t"
    ? oneSampleTTest(params.mu, params.xb, params.sg, params.n, params.al, params.tl)
    : params?.kind === "two-t"
      ? welchTTest(params.xb, params.sg, params.n, params.x2b, params.s2g, params.n2, params.al, params.tl)
      : null;
  const result = zResult ?? tResult;
  const critical = result ? (params?.tl === "two" ? "±" + f(result.crit, 3) : f(result.crit, 3)) : "–";
  const decision = result?.reject ? "Reject H₀" : "Fail to reject H₀";
  const alternativeSymbol = result?.sym ?? "≠";
  const statistic = zResult?.z ?? tResult?.t ?? 0;
  const testName = family === "z"
    ? tType === "one" ? "One-sample Z-test (σ known)." : "Two-sample Z-test (population σ known)."
    : tType === "one" ? "One-sample T-test." : "Welch two-sample T-test.";

  return (
    <section>
      <h1>Hypothesis Testing</h1>
      <p className="sub">{testName}</p>
      <div className="grid">
        <div className="card">
          <h2>Setup</h2>
          <div className="row">
            <div><label htmlFor="test-family">Test type</label>
              <select id="test-family" value={family} onChange={(e) => changeFamily(e.target.value as Family)}>
                <option value="z">Z-Test</option><option value="t">T-Test</option>
              </select></div>
            <div><label htmlFor="sample-test-type">{family === "z" ? "Z-test" : "T-test"}</label>
              <select id="sample-test-type" value={tType} onChange={(e) => changeTType(e.target.value as SampleTestType)}>
                <option value="one">One-Sample {family === "z" ? "Z" : "T"}-Test</option><option value="two">Two-Sample {family === "z" ? "Z" : "T"}-Test</option>
              </select></div>
          </div>
          {tType === "one" ? <>
            <div className="row">
              <div><label htmlFor="mu">{family === "z" ? "μ₀ (null mean)" : "μ₀ (hypothesized mean)"}</label><input id="mu" type="number" step="any" value={v.mu} onChange={(e) => set("mu", e.target.value)} /></div>
              <div><label htmlFor="xb">Sample mean x̄</label><input id="xb" type="number" step="any" value={v.xb} onChange={(e) => set("xb", e.target.value)} /></div>
            </div>
            <div className="row">
              <div><label htmlFor="sg">{family === "z" ? "Population σ" : "Sample standard deviation s"}</label><input id="sg" type="number" min="0" step="any" value={v.sg} onChange={(e) => set("sg", e.target.value)} /></div>
              <div><label htmlFor="nn">Sample size n</label><input id="nn" type="number" min="2" step="1" value={v.n} onChange={(e) => set("n", e.target.value)} /></div>
            </div>
          </> : <>
            <div className="row">
              <div><label htmlFor="xb">Sample mean x̄₁</label><input id="xb" type="number" step="any" value={v.xb} onChange={(e) => set("xb", e.target.value)} /></div>
              <div><label htmlFor="sg">{family === "z" ? "Population σ₁" : "Sample standard deviation s₁"}</label><input id="sg" type="number" min="0" step="any" value={v.sg} onChange={(e) => set("sg", e.target.value)} /></div>
            </div>
            <div className="row">
              <div><label htmlFor="nn">Sample size n₁</label><input id="nn" type="number" min="2" step="1" value={v.n} onChange={(e) => set("n", e.target.value)} /></div>
              <div><label htmlFor="x2b">Sample mean x̄₂</label><input id="x2b" type="number" step="any" value={v.x2b} onChange={(e) => set("x2b", e.target.value)} /></div>
            </div>
            <div className="row">
              <div><label htmlFor="s2g">{family === "z" ? "Population σ₂" : "Sample standard deviation s₂"}</label><input id="s2g" type="number" min="0" step="any" value={v.s2g} onChange={(e) => set("s2g", e.target.value)} /></div>
              <div><label htmlFor="n2">Sample size n₂</label><input id="n2" type="number" min="2" step="1" value={v.n2} onChange={(e) => set("n2", e.target.value)} /></div>
            </div>
          </>}
          <div className="row">
            <div><label htmlFor="al">Significance level α</label>
              <select id="al" value={v.al} onChange={(e) => set("al", e.target.value)}>{["0.10", "0.05", "0.01", "0.001"].map((a) => <option key={a}>{a}</option>)}</select></div>
            <div><label htmlFor="tl">Alternative H₁</label>
              <select id="tl" value={v.tl} onChange={(e) => set("tl", e.target.value as Tail)}>
                <option value="two">{tType === "two" ? "Two-tailed (μ₁ ≠ μ₂)" : "Two-tailed (μ ≠ μ₀)"}</option>
                <option value="right">{tType === "two" ? "Right-tailed (μ₁ &gt; μ₂)" : "Right-tailed (μ &gt; μ₀)"}</option>
                <option value="left">{tType === "two" ? "Left-tailed (μ₁ &lt; μ₂)" : "Left-tailed (μ &lt; μ₀)"}</option>
              </select></div>
          </div>
          <div className="row" style={{ marginTop: 14 }}><button className="btn" onClick={run}>Run test</button></div>
          <div className="err" role="alert">{error || parsed.error}</div>
          {family === "z" && <p className="mut" style={{ fontSize: 12 }}>{tType === "two" ? "Valid when both population standard deviations are known and samples are independent." : "Valid when σ is known and the population is normal or n ≥ 30."}</p>}
          {family === "t" && <p className="mut" style={{ fontSize: 12 }}>{tType === "two" ? "Welch’s independent two-sample t-test does not assume equal variances." : "Uses the sample standard deviation and n − 1 degrees of freedom."}</p>}
        </div>
        <div className="card">
          <h2>Results</h2>
          {!params || !result ? <p className="mut">Enter valid setup values to see results.</p> : <>
            {params.kind === "two-t" || params.kind === "two-z" ? <>
              <StatRow label="H₀">μ₁ − μ₂ = 0</StatRow>
              <StatRow label="H₁">μ₁ − μ₂ {alternativeSymbol} 0</StatRow>
              <StatRow label="Standard error">{f(result.se)}</StatRow>
              <StatRow label={params.kind === "two-z" ? "Z statistic" : "Welch t statistic"}>{f(statistic, 3)}</StatRow>
              {params.kind === "two-t" && <StatRow label="Degrees of freedom">{f(tResult?.df ?? 0, 3)}</StatRow>}
            </> : <>
              <StatRow label="H₀">μ = {f(params.mu)}</StatRow>
              <StatRow label="H₁">μ {alternativeSymbol} {f(params.mu)}</StatRow>
              <StatRow label={params.kind === "z" ? "Standard error σ/√n" : "Standard error s/√n"}>{f(result.se)}</StatRow>
              <StatRow label={params.kind === "z" ? "Z statistic" : "t statistic"}>{f(statistic, 3)}</StatRow>
              {params.kind === "one-t" && <StatRow label="Degrees of freedom">{f(tResult?.df ?? 0, 3)}</StatRow>}
            </>}
            <StatRow label={`Critical ${params.kind === "z" || params.kind === "two-z" ? "Z" : "t"} (α = ${params.al})`}>{critical}</StatRow>
            <StatRow label="p-value">{result.p < 1e-4 ? "< 0.0001" : f(result.p, 4)}</StatRow>
            <p><span className={"pill " + (result.reject ? "rej" : "fail")}>{decision}</span></p>
            <p>{result.reject
              ? `${params.kind === "z" || params.kind === "two-z" ? "Z" : "t"} = ${f(statistic, 3)} is in the rejection region and p ≤ α, so the sample gives enough evidence for the alternative hypothesis.`
              : `${params.kind === "z" || params.kind === "two-z" ? "Z" : "t"} = ${f(statistic, 3)} is outside the rejection region and p > α, so the sample does not give enough evidence for the alternative hypothesis.`}</p>
            {params.kind === "z" && params.n < 30 && <p className="err">n &lt; 30: only valid if the population is normal.</p>}
            {params.kind === "z"
              ? <ul className="steps"><li>Z=(x̄−μ₀)/(σ/√n)=({f(params.xb)}−{f(params.mu)})/{f(result.se)}={f(statistic, 3)}</li></ul>
              : params.kind === "two-z"
                ? <ul className="steps"><li>Z=(x̄₁−x̄₂)/√(σ₁²/n₁+σ₂²/n₂)=({f(params.xb)}−{f(params.x2b)})/{f(result.se)}={f(statistic, 3)}</li></ul>
                : params.kind === "one-t"
                ? <ul className="steps"><li>t=(x̄−μ₀)/(s/√n)=({f(params.xb)}−{f(params.mu)})/{f(result.se)}={f(statistic, 3)}</li></ul>
                : <ul className="steps"><li>t=(x̄₁−x̄₂)/√(s₁²/n₁+s₂²/n₂)=({f(params.xb)}−{f(params.x2b)})/{f(result.se)}={f(statistic, 3)}</li></ul>}
          </>}
          <button className="btn" style={{ marginTop: 12 }} onClick={onSave} disabled={saved || !params}>{saved ? "Saved" : "Save analysis"}</button>
          <div className="err" role="alert">{saveError}</div>
        </div>
        <div className="card full"><h2>Distribution</h2>
          {result && <NormalCurve z={statistic} crit={result.crit} tail={params?.tl ?? "two"} distribution={params?.kind === "z" || params?.kind === "two-z" ? "normal" : "t"} df={tResult?.df ?? 1} />}
        </div>
      </div>
    </section>
  );
}
