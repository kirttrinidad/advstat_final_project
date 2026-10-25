"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dataset } from "@/lib/storage";
import { f, parseCSV, numericColumns, describe } from "@/lib/stats";
import Histogram from "@/components/Histogram";
import { apiRequest } from "@/lib/api";

export default function DataExplorerPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Dataset[]>([]);
  const [busy, setBusy] = useState(false);
  const [analyzed, setAnalyzed] = useState("");
  const [col, setCol] = useState(0);
  useEffect(() => {
    if (user) apiRequest<{ datasets: { id: string; name: string; data: { text: string } }[] }>("/api/datasets")
      .then(({ datasets }) => setSaved(datasets.map((d) => ({ id: d.id, name: d.name, text: d.data.text }))))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load datasets."));
  }, [user]);

  const table = analyzed ? parseCSV(analyzed) : null;
  const cols = table ? numericColumns(table) : [];
  const analyze = (t: string) => {
    const tb = parseCSV(t);
    if (!tb) { setError("Add a header row and at least one data row."); setAnalyzed(""); return; }
    if (!numericColumns(tb).length) { setError("No numeric columns found."); setAnalyzed(""); return; }
    setError(""); setCol(0); setAnalyzed(t);
  };
  const upload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setName(file.name.replace(/\.\w+$/, ""));
    const r = new FileReader();
    r.onload = () => { const t = String(r.result); setText(t); analyze(t); };
    r.readAsText(file);
  };
  const onSave = async () => {
    if (!text.trim()) { setError("Nothing to save yet."); return; }
    setBusy(true); setError("");
    try {
      const result = await apiRequest<{ dataset: { id: string; name: string; data: { text: string } } }>("/api/datasets", {
        method: "POST", body: JSON.stringify({ name: name.trim() || "Untitled dataset", data: text }),
      });
      setSaved((current) => [{ id: result.dataset.id, name: result.dataset.name, text: result.dataset.data.text }, ...current]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save dataset."); }
    finally { setBusy(false); }
  };
  const deleteDataset = async (id: string) => {
    setError("");
    try { await apiRequest("/api/datasets", { method: "DELETE", body: JSON.stringify({ id }) }); setSaved((current) => current.filter((d) => d.id !== id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete dataset."); }
  };

  return (
    <section>
      <h1>Data Explorer</h1>
      <p className="sub">Upload a CSV, then explore its numeric columns.</p>
      <div className="grid">
        <div className="card">
          <h2>Dataset</h2>
          <label htmlFor="df">Upload CSV (first row = headers)</label><input id="df" type="file" accept=".csv,.txt" onChange={upload} />
          <label htmlFor="dt">Or paste CSV</label><textarea id="dt" placeholder={"Hours,Score\n1,55\n2,61"} value={text} onChange={(e) => setText(e.target.value)} />
          <label htmlFor="dn">Dataset name</label><input id="dn" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="row" style={{ marginTop: 10 }}><button className="btn" onClick={() => analyze(text)}>Analyze</button><button className="btn g" onClick={onSave} disabled={busy}>{busy ? "Saving…" : "Save dataset"}</button></div>
          <div className="err" role="alert">{error}</div>
          <h2 style={{ marginTop: 14 }}>Saved datasets</h2>
          {saved.map((d) => (
            <div className="it" key={d.id}><span>{d.name}</span>
              <span><button className="btn g sm" onClick={() => { setText(d.text); setName(d.name); analyze(d.text); }}>Open</button> <button className="btn g sm" onClick={() => deleteDataset(d.id)}>Delete</button></span></div>
          ))}
          {saved.length === 0 && <p className="mut">No saved datasets.</p>}
        </div>
        <div className="card">
          <h2>Summary statistics</h2>
          {!table ? <p className="mut">Load a dataset to see statistics.</p> : (<>
            <div className="sc"><table><thead><tr><th>Column</th><th>n</th><th>Mean</th><th>Median</th><th>SD</th><th>Min</th><th>Max</th></tr></thead>
              <tbody>{cols.map((c) => { const d = describe(c.values); return <tr key={c.name}><td>{c.name}</td><td>{d.n}</td><td>{f(d.mean, 3)}</td><td>{f(d.median, 3)}</td><td>{f(d.sd, 3)}</td><td>{f(d.min, 3)}</td><td>{f(d.max, 3)}</td></tr>; })}</tbody></table></div>
            <p className="mut" style={{ fontSize: 12 }}>SD uses n−1. Non-numeric cells are ignored.</p>
          </>)}
        </div>
        {table && cols[col] && (<>
          <div className="card full">
            <label htmlFor="dcol">Histogram column</label>
            <select id="dcol" value={col} onChange={(e) => setCol(+e.target.value)} style={{ maxWidth: 240 }}>{cols.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}</select>
            <Histogram values={cols[col].values} />
          </div>
          <div className="card full"><h2>Preview (first 8 rows)</h2>
            <div className="sc"><table><thead><tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{table.rows.slice(0, 8).map((r, i) => <tr key={i}>{table.headers.map((_, j) => <td key={j}>{r[j] ?? ""}</td>)}</tr>)}</tbody></table></div>
          </div>
        </>)}
      </div>
    </section>
  );
}
