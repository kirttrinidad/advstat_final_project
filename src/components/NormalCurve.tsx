import { f, pdf, Tail } from "@/lib/stats";

export default function NormalCurve({ z, crit, tail }: { z: number; crit: number; tail: Tail }) {
  const W = 700, H = 290, m = { l: 20, r: 20, t: 14, b: 34 };
  const X = (v: number) => m.l + ((v + 4) / 8) * (W - m.l - m.r);
  const Y = (v: number) => H - m.b - (v / 0.42) * (H - m.t - m.b);
  const area = (a: number, b: number) => {
    let d = `M${X(a)},${Y(0)}`;
    for (let i = 0; i <= 60; i++) { const v = a + ((b - a) * i) / 60; d += `L${X(v)},${Y(pdf(v))}`; }
    return d + `L${X(b)},${Y(0)}Z`;
  };
  let curve = `M${X(-4)},${Y(pdf(-4))}`;
  for (let i = 1; i <= 160; i++) { const v = -4 + i / 20; curve += `L${X(v)},${Y(pdf(v))}`; }
  const marks = tail === "two" ? [-crit, crit] : [crit];
  const zc = Math.max(-3.95, Math.min(3.95, z));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Normal curve with rejection regions">
      {tail !== "right" && <path d={area(-4, Math.max(-4, tail === "two" ? -crit : crit))} fill="var(--shade)" />}
      {tail !== "left" && <path d={area(Math.min(4, crit), 4)} fill="var(--shade)" />}
      <path d={curve} fill="none" stroke="var(--acc)" strokeWidth="2.5" />
      <line x1={m.l} x2={W - m.r} y1={Y(0)} y2={Y(0)} stroke="var(--mute)" />
      {[-3, -2, -1, 0, 1, 2, 3].map((v) => <text key={v} x={X(v)} y={H - 14} textAnchor="middle" fontSize="11" fill="var(--mute)">{v}</text>)}
      {marks.filter((v) => Math.abs(v) <= 4).map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={Y(0)} y2={Y(pdf(v)) - 12} stroke="var(--bad)" strokeDasharray="4 3" />
          <text x={X(v)} y={Y(pdf(v)) - 16} textAnchor="middle" fontSize="11" fill="var(--bad)">{f(v, 2)}</text>
        </g>
      ))}
      <line x1={X(zc)} x2={X(zc)} y1={Y(0)} y2={Y(0.41)} stroke="var(--acc2)" strokeWidth="2.5" />
      <text x={X(zc) + 6} y={Y(0.4)} fontSize="12" fontWeight="700" fill="var(--acc2)">Z = {f(z, 2)}</text>
      <text x={W / 2} y={Y(0.08)} textAnchor="middle" fontSize="12" fill="var(--mute)">Pink = rejection region</text>
    </svg>
  );
}
