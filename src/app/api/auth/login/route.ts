import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSafeDatabaseDiagnostic } from "@/lib/database-diagnostics";
import { getPrisma } from "@/lib/prisma";
import { authConfigurationError, setSession } from "@/lib/server-auth";

const schema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(128), remember: z.boolean().default(true) });

export async function POST(request: Request) {
  const configurationError = authConfigurationError();
  if (configurationError) return NextResponse.json({ error: configurationError }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address and password." }, { status: 400 });
  let failureStage = "prisma-initialize";
  try {
    const prisma = getPrisma();
    failureStage = "find-user";
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    failureStage = "set-session";
    await setSession(user.id, parsed.data.remember);
    failureStage = "create-activity";
    await prisma.activity.create({ data: { userId: user.id, description: "Signed in" } });
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(`[auth/login] Sign-in failed at ${failureStage}.`, getSafeDatabaseDiagnostic(error));
    return NextResponse.json({
      error: "Unable to access the database. Check the Neon DATABASE_URL configuration.",
    }, { status: 503 });
  }
}
