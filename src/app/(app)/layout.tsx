"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  useEffect(() => { if (ready && !user) router.replace("/"); }, [ready, user, router]);
  if (!ready || !user) return null;
  return (
    <div id="app">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
