import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSafeDatabaseDiagnostic } from "@/lib/database-diagnostics";
import { getPrisma } from "@/lib/prisma";
import { authConfigurationError, setSession } from "@/lib/server-auth";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  remember: z.boolean().default(true),
});

export async function POST(request: Request) {
  const configurationError = authConfigurationError();
  if (configurationError) return NextResponse.json({ error: configurationError }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid name, email, and password of at least 8 characters." }, { status: 400 });
  const { name, password, remember } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  let failureStage = "prisma-initialize";
  try {
    const prisma = getPrisma();
    failureStage = "create-user";
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    failureStage = "create-activity";
    await prisma.activity.create({ data: { userId: user.id, description: "Created an account" } });
    failureStage = "set-session";
    await setSession(user.id, remember);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error(`[auth/register] Registration failed at ${failureStage}.`, getSafeDatabaseDiagnostic(error));
    return NextResponse.json({
      error: "Unable to create your account because the database is unavailable. Check the Neon DATABASE_URL configuration.",
    }, { status: 503 });
  }
}
