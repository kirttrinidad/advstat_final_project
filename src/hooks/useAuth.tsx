"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "@/lib/api";

export interface Session { id: string; email: string; name: string }
interface AuthResponse { user: Session | null }
interface AuthCtx {
  user: Session | null;
  ready: boolean;
  initializationError: string;
  login(email: string, pw: string, remember: boolean): Promise<string | null>;
  signup(name: string, email: string, pw: string, confirm: string, remember: boolean): Promise<string | null>;
  logout(): Promise<void>;
  rename(name: string): Promise<string | null>;
  deleteAccount(): Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState("");

  useEffect(() => {
    apiRequest<AuthResponse>("/api/auth/me")
      .then(({ user: session }) => setUser(session))
      .catch((error: unknown) => {
        setUser(null);
        if (error instanceof Error && error.message !== "Authentication required.") setInitializationError(error.message);
      })
      .finally(() => setReady(true));
  }, []);

  const login: AuthCtx["login"] = async (email, password, remember) => {
    try {
      const { user: session } = await apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
      setUser(session);
      setInitializationError("");
      return null;
    } catch (error) { return error instanceof Error ? error.message : "Unable to sign in."; }
  };

  const signup: AuthCtx["signup"] = async (name, email, password, confirm, remember) => {
    if (password !== confirm) return "Passwords do not match.";
    try {
      const { user: session } = await apiRequest<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, remember }) });
      setUser(session);
      setInitializationError("");
      return null;
    } catch (error) { return error instanceof Error ? error.message : "Unable to create your account."; }
  };

  const logout = async () => {
    try { await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" }); }
    finally { setUser(null); }
  };

  const rename: AuthCtx["rename"] = async (name) => {
    try {
      const { user: session } = await apiRequest<AuthResponse>("/api/profile", { method: "PATCH", body: JSON.stringify({ name }) });
      setUser(session);
      return null;
    } catch (error) { return error instanceof Error ? error.message : "Unable to update profile."; }
  };

  const deleteAccount = async () => {
    await apiRequest<{ ok: boolean }>("/api/profile", { method: "DELETE" });
    setUser(null);
  };

  return <Ctx.Provider value={{ user, ready, initializationError, login, signup, logout, rename, deleteAccount }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
