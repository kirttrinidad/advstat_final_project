"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { HistoryItem, save } from "@/lib/storage";
import { apiRequest } from "@/lib/api";

interface StoredAnalysis { id: string; type: string; title: string; inputData: Record<string, unknown>; results: Record<string, unknown>; createdAt: string }

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) return;
    apiRequest<{ analyses: StoredAnalysis[] }>("/api/analyses").then(({ analyses }) => setItems(analyses.map((x) => ({
      id: x.id, type: x.type, name: x.title, date: new Date(x.createdAt).toLocaleDateString(),
      summary: x.type.includes("Z-test")
        ? `Z = ${Number(x.results.z).toFixed(3)}, p = ${Number(x.results.p).toFixed(4)}`
        : x.type.includes("T-test")
          ? `t = ${Number(x.results.t).toFixed(3)}, p = ${Number(x.results.p).toFixed(4)}`
          : String(x.results.equation ?? ""),
      input: x.inputData,
    })))).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load analysis history."));
  }, [user]);

  const open = (x: HistoryItem) => { save("sv_open", x); router.push(x.type.includes("Z-test") || x.type.includes("T-test") ? "/hypothesis" : "/regression"); };
  const del = async (id: string) => {
    setError("");
    try { await apiRequest("/api/analyses", { method: "DELETE", body: JSON.stringify({ id }) }); setItems((current) => current.filter((x) => x.id !== id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to delete analysis."); }
  };
  const exportCsv = () => {
    const q = (s: string) => '"' + s.replace(/"/g, '""') + '"';
    const text = "name,type,date,summary\n" + items.map((x) => [x.name, x.type, x.date, x.summary].map(q).join(",")).join("\n");
    setCsv(text);
    navigator.clipboard?.writeText(text).catch(() => undefined);
  };
  return (
    <section>
      <h1>Analysis History</h1>
      <p className="sub">Reopen, delete or export saved analyses.</p>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="card">
        {items.length > 0 && <div style={{ textAlign: "right" }}><button className="btn g sm" onClick={exportCsv}>Show CSV export</button></div>}
        {items.map((x) => (
          <div className="it" key={x.id}>
            <div>{x.name}<small>{x.type} · {x.date} · {x.summary}</small></div>
            <span style={{ whiteSpace: "nowrap" }}><button className="btn g sm" onClick={() => open(x)}>Open</button> <button className="btn g sm" onClick={() => del(x.id)}>Delete</button></span>
          </div>
        ))}
        {items.length === 0 && <p className="mut">No saved analyses yet. Run a regression or test and press Save analysis.</p>}
      </div>
      {csv && <div className="card" style={{ marginTop: 16 }}><h2>CSV export</h2><textarea readOnly value={csv} /></div>}
    </section>
  );
}
