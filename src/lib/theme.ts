export type Theme = "" | "light" | "dark";
export type Accent = "blue" | "violet" | "teal" | "rose";

export function getTheme(): Theme {
  try {
    const value = localStorage.getItem("sv_theme");
    return value === "light" || value === "dark" ? value : "light";
  } catch { return "light"; }
}

export function setTheme(t: Theme): void {
  document.documentElement.dataset.theme = t || "light";
  try { localStorage.setItem("sv_theme", t || "light"); } catch { /* ignore */ }
}

export function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function getAccent(): Accent {
  try {
    const value = localStorage.getItem("sv_accent");
    return value === "violet" || value === "teal" || value === "rose" ? value : "blue";
  } catch { return "blue"; }
}

export function setAccent(accent: Accent): void {
  document.documentElement.dataset.accent = accent;
  try { localStorage.setItem("sv_accent", accent); } catch { /* ignore */ }
}
