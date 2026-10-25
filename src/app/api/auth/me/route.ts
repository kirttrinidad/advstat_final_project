import { NextResponse } from "next/server";
import { authenticatedUser } from "@/lib/server-auth";

export async function GET() {
  const user = await authenticatedUser();
  return NextResponse.json({ user });
}
