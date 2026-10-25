import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { authenticatedUser, clearSession } from "@/lib/server-auth";

export async function PATCH(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = z.object({ name: z.string().trim().min(1).max(100) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name between 1 and 100 characters." }, { status: 400 });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name }, select: { id: true, name: true, email: true } });
  await prisma.activity.create({ data: { userId: user.id, description: "Updated profile" } });
  return NextResponse.json({ user: updated });
}

export async function DELETE() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  await prisma.user.delete({ where: { id: user.id } });
  await clearSession();
  return NextResponse.json({ ok: true });
}
