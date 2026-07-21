import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Normalizes to a UTC-midnight Date representing the server's local
// calendar day, matching the HabitLog.date @db.Date column.
function todayAsDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) {
    return NextResponse.json({ error: "habit not found" }, { status: 404 });
  }

  const date = todayAsDate();

  // Upsert keyed on the (habitId, date) unique constraint — idempotent,
  // tapping "done" repeatedly for the same day never creates duplicates.
  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: id, date } },
    update: { completed: true },
    create: { habitId: id, date, completed: true },
  });

  return NextResponse.json(log, { status: 200 });
}
