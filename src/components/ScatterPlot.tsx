import { f, Pair } from "@/lib/stats";

export default function ScatterPlot({ pts, a, b, px }: { pts: Pair[]; a: number; b: number; px?: number }) {
  const W = 700, H = 320, m = { l: 50, r: 16, t: 12, b: 34 };
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys, a + b * x0, a + b * x1), y1 = Math.max(...ys, a + b * x0, a + b * x1);
  const dx = (x1 - x0) * 0.06 || 1, dy = (y1 - y0) * 0.08 || 1;
  x0 -= dx; x1 += dx; y0 -= dy; y1 += dy;
  const X = (v: number) => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (v: number) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter plot with regression line">
      {[0, 1, 2, 3, 4].map((i) => {
        const vx = x0 + ((x1 - x0) * i) / 4, vy = y0 + ((y1 - y0) * i) / 4;
        return (
          <g key={i}>
            <line x1={m.l} x2={W - m.r} y1={Y(vy)} y2={Y(vy)} stroke="var(--line)" />
            <text x={m.l - 6} y={Y(vy) + 4} textAnchor="end" fontSize="11" fill="var(--mute)">{f(vy, 2)}</text>
            <text x={X(vx)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--mute)">{f(vx, 2)}</text>
          </g>
        );
      })}
      <line x1={X(x0)} y1={Y(a + b * x0)} x2={X(x1)} y2={Y(a + b * x1)} stroke="var(--acc2)" strokeWidth="2.5" />
      {pts.map(([x, y], i) => <circle key={i} cx={X(x)} cy={Y(y)} r="5" fill="var(--cy)" stroke="var(--card)" strokeWidth="1.5" />)}
      {px !== undefined && <circle cx={X(px)} cy={Y(a + b * px)} r="6" fill="none" stroke="var(--bad)" strokeWidth="2.5" />}
    </svg>
  );
}
