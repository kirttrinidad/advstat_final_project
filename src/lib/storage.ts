export interface HistoryItem { id: string; type: string; name: string; date: string; summary: string; input: Record<string, unknown> }
export interface Dataset { id: string; name: string; text: string }

const mem: Record<string, unknown> = {};
export function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); if (v) return JSON.parse(v) as T; } catch { /* storage unavailable */ }
  return key in mem ? (mem[key] as T) : fallback;
}
export function save(key: string, value: unknown): void {
  mem[key] = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
export function remove(key: string): void {
  delete mem[key];
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
export const today = (): string => new Date().toISOString().slice(0, 10);
