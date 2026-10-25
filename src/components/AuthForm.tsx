"use client";
import { FormEvent, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const up = mode === "up";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (!pw || (up && pw.length < 8)) { setError("Password must be at least 8 characters."); return; }
    if (up && !name.trim()) { setError("Enter your name."); return; }
    if (up && pw !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const err = up ? await signup(name, email, pw, confirm, remember) : await login(email, pw, remember);
      if (err) setError(err);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to connect. Check your server and try again.");
    } finally {
      setBusy(false);
    }
  }
  const switchTo = (m: "in" | "up") => { setMode(m); setError(""); };

  return (
    <div className="box">
      <div className="logo">Stat<i>Verse</i></div>
      <div className="mut">Analyze, learn, make better decisions.</div>
      <div className="tabs">
        <button type="button" className={up ? "" : "on"} onClick={() => switchTo("in")}>Log in</button>
        <button type="button" className={up ? "on" : ""} onClick={() => switchTo("up")}>Create account</button>
      </div>
      <form onSubmit={submit} noValidate>
        {up && (<><label htmlFor="nm">Full name</label><input id="nm" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} /></>)}
        <label htmlFor="em">Email address</label>
        <input id="em" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">Password</label>
        <div className="pw">
          <input id="pw" type={show ? "text" : "password"} autoComplete={up ? "new-password" : "current-password"} minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
          <button type="button" aria-label="Toggle password visibility" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
        </div>
        {up && (<><label htmlFor="cf">Confirm password</label><input id="cf" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></>)}
        <div className="chk">
          <label style={{ display: "flex", gap: 8, margin: 0, alignItems: "center" }}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
          <span className="sp" />
          <a href="#" style={{ color: "var(--acc)" }} onClick={(e) => { e.preventDefault(); setError("Password reset is not configured yet. Contact your workspace administrator."); }}>Forgot password?</a>
        </div>
        <div className="err" role="alert" aria-live="polite">{error}</div>
        <button className="btn" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : up ? "Create account" : "Log in"}</button>
      </form>
      <p className="mut auth-note">Your account and analysis data are securely stored and available when you sign in.</p>
    </div>
  );
}
