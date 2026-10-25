/** Pure statistics functions. No React or DOM code here. */
export type Pair = [number, number];
export type Tail = "two" | "left" | "right";

export const f = (v: number, d = 4): string => (Number.isFinite(v) ? String(+v.toFixed(d)) : "–");

/** Error function (Abramowitz-Stegun 7.1.26, max error about 1.5e-7). */
export function erf(x: number): number {
  const s = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
}
export const Phi = (z: number): number => 0.5 * (1 + erf(z / Math.SQRT2));
export const pdf = (z: number): number => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
export function zInv(p: number): number {
  let a = -8, b = 8;
  for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (Phi(m) < p) a = m; else b = m; }
  return (a + b) / 2;
}
export function strength(r: number): string {
  const a = Math.abs(r);
  return a >= 0.9 ? "very strong" : a >= 0.7 ? "strong" : a >= 0.5 ? "moderate" : a >= 0.3 ? "weak" : "very weak or none";
}

export function parsePairs(text: string): { pts: Pair[]; skipped: number } {
  const pts: Pair[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) continue;
    const p = l.split(/[,\s;]+/), x = parseFloat(p[0]), y = parseFloat(p[1]);
    if (p.length >= 2 && Number.isFinite(x) && Number.isFinite(y)) pts.push([x, y]);
    else if (pts.length) skipped++;
  }
  return { pts, skipped };
}

export interface Regression { n: number; mx: number; my: number; sxx: number; syy: number; sxy: number; a: number; b: number; r: number }
/** Least-squares line. Returns null when all X values are identical. */
export function regress(pts: Pair[]): Regression | null {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  if (sxx === 0) return null;
  const b = sxy / sxx;
  return { n, mx, my, sxx, syy, sxy, b, a: my - b * mx, r: syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy) };
}

export interface ZResult { se: number; z: number; p: number; crit: number; reject: boolean; sym: string }
export function zTest(mu: number, xb: number, sigma: number, n: number, alpha: number, tail: Tail): ZResult {
  const se = sigma / Math.sqrt(n), z = (xb - mu) / se;
  let p: number, crit: number, reject: boolean;
  if (tail === "two") { p = 2 * (1 - Phi(Math.abs(z))); crit = zInv(1 - alpha / 2); reject = Math.abs(z) > crit; }
  else if (tail === "right") { p = 1 - Phi(z); crit = zInv(1 - alpha); reject = z > crit; }
  else { p = Phi(z); crit = zInv(alpha); reject = z < crit; }
  return { se, z, p, crit, reject, sym: tail === "two" ? "≠" : tail === "right" ? ">" : "<" };
}

export interface CsvTable { headers: string[]; rows: string[][] }
export function parseCSV(text: string): CsvTable | null {
  const rows = text.trim().split(/\r?\n/).map((r) => r.split(/[,\t;]/).map((c) => c.trim()));
  if (rows.length < 2) return null;
  return { headers: rows[0], rows: rows.slice(1).filter((r) => r.some((c) => c)) };
}
export interface Column { name: string; values: number[] }
export function numericColumns(t: CsvTable): Column[] {
  return t.headers
    .map((name, i) => ({ name, values: t.rows.map((r) => parseFloat(r[i] ?? "")).filter(Number.isFinite) }))
    .filter((c) => c.values.length >= 2 && c.values.length >= t.rows.length / 2);
}
export function describe(values: number[]) {
  const v = [...values].sort((a, b) => a - b), n = v.length, mean = v.reduce((s, x) => s + x, 0) / n;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1));
  const median = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
  return { n, mean, median, sd, min: v[0], max: v[n - 1] };
}
export function histogram(values: number[]) {
  const min = Math.min(...values), max = Math.max(...values);
  const k = Math.max(3, Math.ceil(Math.log2(values.length) + 1)), width = (max - min) / k || 1;
  const counts = Array<number>(k).fill(0);
  for (const x of values) counts[Math.min(k - 1, Math.floor((x - min) / width))]++;
  return { counts, min, width };
}
