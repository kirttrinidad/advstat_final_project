import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { authenticatedUser } from "@/lib/server-auth";

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  return NextResponse.json({ reports: await prisma.savedReport.findMany({ where: { userId: user.id }, orderBy: { savedAt: "desc" } }) });
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = z.object({ title: z.string().trim().min(1).max(160), analysisId: z.string().min(1).optional() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "A report title is required." }, { status: 400 });
  if (parsed.data.analysisId) {
    const owned = await prisma.analysis.findFirst({ where: { id: parsed.data.analysisId, userId: user.id }, select: { id: true } });
    if (!owned) return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
  }
  const report = await prisma.savedReport.create({ data: { ...parsed.data, userId: user.id } });
  await prisma.activity.create({ data: { userId: user.id, description: `Saved report: ${report.title}` } });
  return NextResponse.json({ report }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Report ID is required." }, { status: 400 });
  const result = await prisma.savedReport.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
  if (!result.count) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
