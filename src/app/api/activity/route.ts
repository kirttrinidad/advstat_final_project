import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { authenticatedUser } from "@/lib/server-auth";

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const prisma = getPrisma();
  const activity = await prisma.activity.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ activity });
}
