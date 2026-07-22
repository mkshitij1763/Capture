// Normalizes to a UTC-midnight Date representing the server's local
// calendar day, matching the HabitLog.date @db.Date column.
export function todayAsDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function computeStreak(completedDates: Set<string>): number {
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
