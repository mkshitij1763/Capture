import { prisma } from "@/lib/prisma";
import { HabitsGrid, type HabitItem } from "./habits-grid";

// Live data (today's completion state) — never prerender/cache at build time.
export const dynamic = "force-dynamic";

function todayAsDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeStreak(completedDates: Set<string>): number {
  let cursor = todayAsDate();
  if (!completedDates.has(ymd(cursor))) {
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  let streak = 0;
  while (completedDates.has(ymd(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  return streak;
}

export default async function HabitsPage() {
  const habits = await prisma.habit.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      // A year of history is far more than streaks need, but the table
      // stays small at this scale — no reason to build a windowed query.
      logs: { where: { completed: true }, orderBy: { date: "desc" }, take: 400 },
    },
  });

  const today = ymd(todayAsDate());

  const items: HabitItem[] = habits.map((habit) => {
    const completedDates = new Set(habit.logs.map((log) => ymd(log.date)));
    return {
      id: habit.id,
      name: habit.name,
      frequency: habit.frequency,
      doneToday: completedDates.has(today),
      streak: computeStreak(completedDates),
    };
  });

  return (
    <main className="shell-page">
      <section className="shell-header">
        <h1 className="shell-title">Habits</h1>
        <p className="shell-subtitle">Small wins, tracked gently.</p>
      </section>
      <HabitsGrid items={items} />
    </main>
  );
}
