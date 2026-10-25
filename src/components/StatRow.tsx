import { ReactNode } from "react";
export default function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="st"><span>{label}</span><b>{children}</b></div>;
}
