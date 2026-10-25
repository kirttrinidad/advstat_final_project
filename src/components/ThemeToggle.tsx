"use client";
import { useEffect, useState } from "react";
import { currentTheme, getAccent, getTheme, setAccent, setTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setCurrentTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = getTheme();
    setTheme(saved);
    setAccent(getAccent());
    setCurrentTheme(saved || "light");
  }, []);
  const toggle = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    setCurrentTheme(next);
  };
  return <button type="button" className="nv theme-button" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} onClick={toggle}>
    <span className="theme-toggle-icon" aria-hidden="true">{theme === "dark" ? "☼" : "◐"}</span>
    <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
  </button>;
}
