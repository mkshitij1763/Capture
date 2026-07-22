import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayAsDate, ymd, computeStreak } from "@/lib/habit-streak";

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

  // Toggle: if today's row is already completed, flip it back to false
  // rather than deleting it — the (habitId, date) row still exists,
  // recording that today was visited and un-marked, same as the schema's
  // `completed` boolean is there to represent.
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId: id, date } },
  });
  const nextCompleted = !(existing?.completed ?? false);

  await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: id, date } },
    update: { completed: nextCompleted },
    create: { habitId: id, date, completed: nextCompleted },
  });

  // Recompute the streak fresh rather than having the client guess +1/-1 —
  // correct by construction even if the streak rules change later.
  const completedLogs = await prisma.habitLog.findMany({
    where: { habitId: id, completed: true },
    orderBy: { date: "desc" },
    take: 400,
  });
  const completedDates = new Set(completedLogs.map((log) => ymd(log.date)));
  const streak = computeStreak(completedDates);

  return NextResponse.json({ doneToday: nextCompleted, streak }, { status: 200 });
}
