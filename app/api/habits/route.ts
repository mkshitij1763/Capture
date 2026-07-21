import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HabitFrequency } from "@/generated/prisma/enums";

const VALID_FREQUENCIES = Object.values(HabitFrequency);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const frequency = body?.frequency;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!VALID_FREQUENCIES.includes(frequency as HabitFrequency)) {
    return NextResponse.json(
      { error: `frequency must be one of: ${VALID_FREQUENCIES.join(", ")}` },
      { status: 400 }
    );
  }

  const habit = await prisma.habit.create({
    data: { name, frequency },
  });

  return NextResponse.json(habit, { status: 201 });
}
