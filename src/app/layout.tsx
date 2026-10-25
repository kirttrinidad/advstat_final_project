import type { Metadata } from "next";
import { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = { title: "StatVerse", description: "Simple Linear Regression and Hypothesis Testing" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
