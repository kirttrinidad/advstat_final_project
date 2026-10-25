"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { load, remove, today } from "@/lib/storage";
import { apiRequest } from "@/lib/api";
import { f, parsePairs, regress, strength } from "@/lib/stats";
import ScatterPlot from "@/components/ScatterPlot";
import StatRow from "@/components/StatRow";

const SAMPLE = "1,55\n2,58\n3,63\n4,68\n5,70\n6,77\n7,79\n8,85";
interface Pending { type: string; name: string; input: { data: string } }

export default function RegressionPage() {
  const { user } = useAuth();
  const [text, setText] = useState(SAMPLE);
  const [run, setRun] = useState(SAMPLE);
  const [predict, setPredict] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const o = load<Pending | null>("sv_open", null);
    if (o && o.type === "Linear regression") { setText(o.input.data); setRun(o.input.data); setName(o.name); remove("sv_open"); }
  }, []);

  const { pts, skipped } = parsePairs(run);
  const res = pts.length >= 3 ? regress(pts) : null;
  const error = pts.length < 3 ? "Enter at least 3 valid (X, Y) pairs." : !res ? "All X values are identical, so a slope cannot be computed." : "";
  const pn = predict === "" ? NaN : parseFloat(predict);
  const px = Number.isFinite(pn) ? pn : undefined;
  const calc = (t: string) => { setRun(t); setSaved(false); };
  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { const t = String(r.result); setText(t); calc(t); };
    r.readAsText(file);
  };
  const eq = res ? `Y = ${f(res.a)} ${res.b < 0 ? "−" : "+"} ${f(Math.abs(res.b))}X` : "";
  const onSave = async () => {
    if (!user || !res) return;
    setSaveError("");
    const title = name.trim() || `Linear regression ${today()}`;
    try {
      await apiRequest("/api/analyses", {
        method: "POST",
        body: JSON.stringify({
          type: "Linear regression", title, inputData: { data: run },
          results: { equation: eq, slope: res.b, intercept: res.a, correlation: Number.isFinite(res.r) ? res.r : null, rSquared: res.r * res.r },
        }),
      });
      setSaved(true);
    } catch (error) { setSaveError(error instanceof Error ? error.message : "Unable to save analysis."); }
  };

  return (
    <section>
      <h1>Simple Linear Regression</h1>
      <p className="sub">Analyze the relationship between two variables.</p>
      <div className="grid">
        <div className="card">
          <h2>Data input</h2>
          <label htmlFor="rd">One X,Y pair per line (comma, space or tab). Header rows and blanks are skipped.</label>
          <textarea id="rd" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => calc(text)}>Calculate</button>
            <button className="btn g" onClick={() => { setText(SAMPLE); calc(SAMPLE); }}>Load sample</button>
          </div>
          <label htmlFor="rf">Upload CSV</label><input id="rf" type="file" accept=".csv,.txt" onChange={upload} />
          <label htmlFor="rp">Predict Y for X =</label><input id="rp" type="number" step="any" value={predict} onChange={(e) => setPredict(e.target.value)} />
          <label htmlFor="rn">Analysis name</label><input id="rn" placeholder="e.g. Study hours vs score" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="err">{error}</div>
        </div>
        <div className="card">
          <h2>Results</h2>
          {!res ? <p className="mut">Enter at least 3 pairs and press Calculate.</p> : (<>
            <div className="eq">{eq}</div>
            <StatRow label="Slope b">{f(res.b)}</StatRow>
            <StatRow label="Intercept a">{f(res.a)}</StatRow>
            <StatRow label="Correlation r">{f(res.r)}</StatRow>
            <StatRow label="R²">{f(res.r * res.r)}</StatRow>
            <StatRow label="Strength">{Number.isFinite(res.r) ? `${strength(res.r)}, ${res.b > 0 ? "positive" : res.b < 0 ? "negative" : "flat"}` : "undefined (Y constant)"}</StatRow>
            {px !== undefined && <StatRow label={`Predicted Y at X = ${f(px)}`}>{f(res.a + res.b * px)}</StatRow>}
            {skipped > 0 && <p className="err">{skipped} line(s) skipped: missing or non-numeric values.</p>}
            {Number.isFinite(res.r) && <p>For each 1-unit increase in X, Y changes by about {f(res.b, 3)}. X explains {f(res.r * res.r * 100, 1)}% of the variation in Y.</p>}
            <ul className="steps">
              <li>n={res.n}, x̄={f(res.mx)}, ȳ={f(res.my)}</li>
              <li>Sxx={f(res.sxx)}, Sxy={f(res.sxy)}, Syy={f(res.syy)}</li>
              <li>b=Sxy/Sxx={f(res.b)}; a=ȳ−b·x̄={f(res.a)}</li>
              <li>r=Sxy/√(Sxx·Syy)={f(res.r)}</li>
            </ul>
            <button className="btn" style={{ marginTop: 12 }} onClick={onSave} disabled={saved}>{saved ? "Saved" : "Save analysis"}</button>
            <div className="err" role="alert">{saveError}</div>
          </>)}
        </div>
        {res && (<>
          <div className="card full"><h2>Scatter plot</h2><ScatterPlot pts={pts} a={res.a} b={res.b} px={px} /></div>
          <div className="card full"><h2>Residuals</h2>
            <div className="sc"><table><thead><tr><th>X</th><th>Y</th><th>Predicted</th><th>Residual</th></tr></thead>
              <tbody>{pts.map(([x, y], i) => <tr key={i}><td>{f(x)}</td><td>{f(y)}</td><td>{f(res.a + res.b * x)}</td><td>{f(y - res.a - res.b * x)}</td></tr>)}</tbody></table></div>
          </div>
        </>)}
      </div>
    </section>
  );
}
