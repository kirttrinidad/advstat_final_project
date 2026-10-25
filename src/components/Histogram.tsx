import { f, histogram } from "@/lib/stats";

export default function Histogram({ values }: { values: number[] }) {
  const { counts, min, width } = histogram(values);
  const W = 700, H = 260, max = Math.max(...counts), bw = (W - 60) / counts.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Histogram">
      {counts.map((c, i) => {
        const h = (c / max) * (H - 50), x = 40 + i * bw;
        return (
          <g key={i}>
            <rect x={x + 2} y={H - 30 - h} width={bw - 4} height={h} fill="var(--acc)" rx="3" />
            <text x={x + bw / 2} y={H - 34 - h} textAnchor="middle" fontSize="11" fill="var(--mute)">{c}</text>
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" fontSize="10" fill="var(--mute)">{f(min + i * width, 2)}</text>
          </g>
        );
      })}
    </svg>
  );
}
