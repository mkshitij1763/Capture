import { NextResponse } from "next/server";
import { classifyCapture } from "@/lib/classify";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await classifyCapture(id);
  return NextResponse.json({ ok: true });
}
