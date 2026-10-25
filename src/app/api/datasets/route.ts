import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { authenticatedUser } from "@/lib/server-auth";

const schema = z.object({ name: z.string().trim().min(1).max(160), description: z.string().max(1000).optional(), data: z.string().min(1).max(2_000_000) });

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const datasets = await prisma.dataset.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ datasets });
}

export async function POST(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dataset name and data are required." }, { status: 400 });
  const dataset = await prisma.dataset.create({
    data: { userId: user.id, name: parsed.data.name, description: parsed.data.description, data: { text: parsed.data.data } },
  });
  await prisma.activity.create({ data: { userId: user.id, description: `Saved dataset: ${dataset.name}` } });
  return NextResponse.json({ dataset }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dataset ID is required." }, { status: 400 });
  const result = await prisma.dataset.deleteMany({ where: { id: parsed.data.id, userId: user.id } });
  if (!result.count) return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
  await prisma.activity.create({ data: { userId: user.id, description: "Deleted a dataset" } });
  return NextResponse.json({ ok: true });
}
