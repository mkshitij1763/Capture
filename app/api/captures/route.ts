import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const capture = await prisma.capture.create({
    data: { content },
  });

  return NextResponse.json(capture, { status: 201 });
}
