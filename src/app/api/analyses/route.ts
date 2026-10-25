import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { authenticatedUser } from "@/lib/server-auth";

const schema = z.object({
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  inputData: z.record(z.string(), z.json()),
  results: z.record(z.string(), z.json()),
});

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const analyses = await prisma.analysis.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ analyses });
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Analysis data is invalid." }, { status: 400 });
  const analysis = await prisma.$transaction(async (tx) => {
    const created = await tx.analysis.create({ data: { ...parsed.data, userId: user.id } });
    await tx.savedReport.create({ data: { userId: user.id, analysisId: created.id, title: created.title } });
    await tx.activity.create({ data: { userId: user.id, description: `Saved ${created.type}: ${created.title}` } });
    return created;
  });
  return NextResponse.json({ analysis }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Analysis ID is required." }, { status: 400 });
  const result = await prisma.analysis.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
  if (result.count === 0) return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  await prisma.activity.create({ data: { userId: user.id, description: "Deleted a saved analysis" } });
  return NextResponse.json({ ok: true });
}
