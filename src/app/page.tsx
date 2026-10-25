"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, ready, initializationError } = useAuth();
  const router = useRouter();
  useEffect(() => { if (ready && user) router.replace("/dashboard"); }, [ready, user, router]);
  if (!ready || user) return null;
  return (
    <div id="auth" className="auth-scene">
      <div className="auth-glow auth-glow-a" />
      <div className="auth-glow auth-glow-b" />
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />
      <div className="auth-orb auth-orb-three" aria-hidden="true" />
      <div className="auth-chart" aria-hidden="true">
        <svg viewBox="0 0 520 260" role="presentation">
          <path className="chart-grid" d="M10 50H510M10 100H510M10 150H510M10 200H510M60 10V250M160 10V250M260 10V250M360 10V250M460 10V250" />
          <path className="chart-line chart-line-one" d="M15 205 C65 190 80 138 130 151 S205 187 245 122 S320 110 350 78 S420 96 505 28" />
          <path className="chart-line chart-line-two" d="M15 228 C70 208 105 218 145 185 S215 202 270 166 S350 184 395 136 S450 146 505 104" />
          <circle className="chart-point p1" cx="130" cy="151" r="5" /><circle className="chart-point p2" cx="245" cy="122" r="5" />
          <circle className="chart-point p3" cx="350" cy="78" r="5" /><circle className="chart-point p4" cx="505" cy="28" r="5" />
        </svg>
      </div>
      {initializationError && <p className="auth-init-error" role="alert">{initializationError}</p>}
      <AuthForm />
      <div style={{ display: "none" }}><ThemeToggle /></div>
    </div>
  );
}
