"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Accent, getAccent, getTheme, setAccent, setTheme, Theme } from "@/lib/theme";

export default function SettingsPage() {
  const { user, rename, logout, deleteAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [msg, setMsg] = useState("");
  const [theme, setT] = useState<Theme>("");
  const [accent, setA] = useState<Accent>("blue");
  useEffect(() => { if (user) setName(user.name); }, [user]);
  useEffect(() => {
    const savedTheme = getTheme();
    const savedAccent = getAccent();
    setT(savedTheme);
    setA(savedAccent);
    setTheme(savedTheme);
    setAccent(savedAccent);
  }, []);
  const saveName = async () => {
    if (!name.trim()) { setMsg("Name cannot be empty."); return; }
    const error = await rename(name.trim());
    setMsg(error ?? "Profile saved.");
  };
  const removeAccount = async () => {
    if (!confirm("Delete your account and all saved analyses and datasets? This cannot be undone.")) return;
    try { await deleteAccount(); }
    catch (error) { setMsg(error instanceof Error ? error.message : "Unable to delete account."); }
  };
  return (
    <section>
      <h1>Settings</h1>
      <p className="sub">Profile and preferences.</p>
      <div className="grid">
        <div className="card"><h2>Profile</h2>
          <label htmlFor="sn">Name</label><input id="sn" value={name} onChange={(e) => setName(e.target.value)} />
          <label>Email</label><div className="mut">{user?.email}</div>
          <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={saveName}>Save profile</button></div>
          <div className="err" role="status">{msg}</div></div>
        <div className="card appearance-card"><h2>Appearance and account</h2>
          <label htmlFor="stm">Color mode</label>
          <select id="stm" value={theme} onChange={(e) => { const t = e.target.value as Theme; setT(t); setTheme(t); }}>
            <option value="light">Light</option><option value="dark">Dark</option></select>
          <label htmlFor="accent">Accent color</label>
          <select id="accent" value={accent} onChange={(e) => { const value = e.target.value as Accent; setA(value); setAccent(value); }}>
            <option value="blue">Ocean blue</option><option value="violet">Violet</option><option value="teal">Teal</option><option value="rose">Rose</option>
          </select>
          <div className="accent-swatches" aria-label={`Current accent: ${accent}`}>
            {(["blue", "violet", "teal", "rose"] as const).map((color) => (
              <button key={color} type="button" className={`accent-swatch accent-${color}${accent === color ? " selected" : ""}`} onClick={() => { setA(color); setAccent(color); }} aria-label={`Use ${color} accent`} aria-pressed={accent === color} />
            ))}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn g" onClick={() => { void logout(); }}>Log out</button>
            <button className="btn g" onClick={() => { void removeAccount(); }}>Delete my data</button>
          </div></div>
      </div>
    </section>
  );
}
