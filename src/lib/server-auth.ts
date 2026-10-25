import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";

const COOKIE_NAME = "statverse_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const developmentGlobal = globalThis as typeof globalThis & { statverseDevelopmentSecret?: string };

function secret(): string {
  let value = process.env.SESSION_SECRET;
  if ((!value || value.length < 32) && process.env.NODE_ENV !== "production") {
    value ??= developmentGlobal.statverseDevelopmentSecret;
    if (!value || value.length < 32) {
      value = randomBytes(32).toString("hex");
      developmentGlobal.statverseDevelopmentSecret = value;
      console.warn("[auth] SESSION_SECRET is not set; using a temporary development-only session secret.");
    }
  }
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function signature(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function assertSessionConfiguration(): void {
  secret();
}

export function authConfigurationError(): string | null {
  if (!process.env.DATABASE_URL) {
    return "The database is not configured. Set the SQLite DATABASE_URL in .env and run npm.cmd run db:migrate.";
  }
  if (process.env.NODE_ENV === "production" && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)) {
    return "SESSION_SECRET is missing or too short. Set a random secret of at least 32 characters in .env.";
  }
  return null;
}

export async function setSession(userId: string, remember: boolean): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: SESSION_SECONDS } : {}),
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function authenticatedUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, supplied] = parts;
  const payload = `${userId}.${expiry}`;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(supplied);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  if (!/^\d+$/.test(expiry) || Number(expiry) <= Math.floor(Date.now() / 1000)) return null;
  return getPrisma().user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
}
