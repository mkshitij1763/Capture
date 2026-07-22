import { prisma } from "@/lib/prisma";
import { todayAsDate, ymd, computeStreak } from "@/lib/habit-streak";
import { HabitsGrid, type HabitItem } from "./habits-grid";

// Live data (today's completion state) — never prerender/cache at build time.
export const dynamic = "force-dynamic";

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
