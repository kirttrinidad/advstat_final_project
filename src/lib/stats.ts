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

export function twoSampleZTest(
  mean1: number, sigma1: number, n1: number, mean2: number, sigma2: number, n2: number, alpha: number, tail: Tail,
): ZResult {
  const se = Math.sqrt(sigma1 ** 2 / n1 + sigma2 ** 2 / n2), z = (mean1 - mean2) / se;
  let p: number, crit: number, reject: boolean;
  if (tail === "two") { p = 2 * (1 - Phi(Math.abs(z))); crit = zInv(1 - alpha / 2); reject = Math.abs(z) > crit; }
  else if (tail === "right") { p = 1 - Phi(z); crit = zInv(1 - alpha); reject = z > crit; }
  else { p = Phi(z); crit = zInv(alpha); reject = z < crit; }
  return { se, z, p, crit, reject, sym: tail === "two" ? "≠" : tail === "right" ? ">" : "<" };
}

function logGamma(z: number): number {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  const x = z - 1;
  let sum = 0.99999999999980993;
  for (let i = 0; i < coefficients.length; i++) sum += coefficients[i] / (x + i + 1);
  const t = x + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(sum);
}

function betaFraction(a: number, b: number, x: number): number {
  const maxIterations = 200, epsilon = 3e-14, tiny = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let result = d;
  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    result *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    result *= delta;
    if (Math.abs(delta - 1) < epsilon) return result;
  }
  return result;
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const factor = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log1p(-x));
  return x < (a + 1) / (a + b + 2)
    ? factor * betaFraction(a, b, x) / a
    : 1 - factor * betaFraction(b, a, 1 - x) / b;
}

/** Student's t cumulative distribution function. */
export function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const tail = 0.5 * regularizedBeta(x, df / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

/** Student's t probability density function. */
export function tPDF(t: number, df: number): number {
  return Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2))
    / Math.sqrt(df * Math.PI) * (1 + t * t / df) ** (-(df + 1) / 2);
}

/** Inverse Student's t CDF, found by monotone bisection. */
export function tInv(p: number, df: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let low = -1, high = 1;
  while (tCDF(low, df) > p) low *= 2;
  while (tCDF(high, df) < p) high *= 2;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    if (tCDF(middle, df) < p) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

export interface TResult { se: number; t: number; df: number; p: number; crit: number; reject: boolean; sym: string }
function tResult(t: number, se: number, df: number, alpha: number, tail: Tail): TResult {
  let p: number, crit: number, reject: boolean;
  if (tail === "two") { p = 2 * (1 - tCDF(Math.abs(t), df)); crit = tInv(1 - alpha / 2, df); reject = Math.abs(t) > crit; }
  else if (tail === "right") { p = 1 - tCDF(t, df); crit = tInv(1 - alpha, df); reject = t > crit; }
  else { p = tCDF(t, df); crit = tInv(alpha, df); reject = t < crit; }
  return { se, t, df, p: Math.max(0, Math.min(1, p)), crit, reject, sym: tail === "two" ? "≠" : tail === "right" ? ">" : "<" };
}

export function oneSampleTTest(mu: number, xb: number, s: number, n: number, alpha: number, tail: Tail): TResult {
  const se = s / Math.sqrt(n);
  return tResult((xb - mu) / se, se, n - 1, alpha, tail);
}

export function welchTTest(
  mean1: number, sd1: number, n1: number, mean2: number, sd2: number, n2: number, alpha: number, tail: Tail,
): TResult {
  const variance1 = sd1 * sd1 / n1, variance2 = sd2 * sd2 / n2;
  const se = Math.sqrt(variance1 + variance2);
  const df = (variance1 + variance2) ** 2
    / (variance1 ** 2 / (n1 - 1) + variance2 ** 2 / (n2 - 1));
  return tResult((mean1 - mean2) / se, se, df, alpha, tail);
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
