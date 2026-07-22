"use client";

import { useState, type FormEvent } from "react";

type Frequency = "daily" | "weekly" | "custom";

export type HabitItem = {
  id: string;
  name: string;
  frequency: Frequency;
  doneToday: boolean;
  streak: number;
};

async function toggleDone(id: string): Promise<{ doneToday: boolean; streak: number }> {
  const res = await fetch(`/api/habits/${id}/complete`, { method: "POST" });
  if (!res.ok) throw new Error("toggle done failed");
  return res.json();
}

async function createHabit(name: string, frequency: Frequency) {
  const res = await fetch("/api/habits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, frequency }),
  });
  if (!res.ok) throw new Error("create habit failed");
  return res.json();
}

export function HabitsGrid({ items: initialItems }: { items: HabitItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(false);

  async function handleToggleDone(id: string) {
    setPendingId(id);
    setErrorId(null);
    try {
      const { doneToday, streak } = await toggleDone(id);
      // Both values come straight from the server's recomputed streak —
      // no client-side guessing, so un-marking today correctly drops the
      // count back down and re-marking brings it back up.
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, doneToday, streak } : item))
      );
    } catch {
      setErrorId(id);
    } finally {
      setPendingId(null);
    }
  }

  async function handleAddHabit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setFormError(false);
    try {
      const habit = await createHabit(trimmed, frequency);
      setItems((current) => [
        ...current,
        { id: habit.id, name: habit.name, frequency: habit.frequency, doneToday: false, streak: 0 },
      ]);
      setName("");
      setFrequency("daily");
      setFormOpen(false);
    } catch {
      setFormError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {formOpen && (
        <form className="add-habit-form" onSubmit={handleAddHabit}>
          <input
            type="text"
            className="date-input"
            placeholder="Habit name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
          <select
            className="date-input"
            value={frequency}
            onChange={(event) => setFrequency(event.target.value as Frequency)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
          <button type="submit" className="btn-primary" disabled={!name.trim() || submitting}>
            Save habit
          </button>
          {formError && (
            <p className="status status-error" role="status">
              Couldn&apos;t save — try again
            </p>
          )}
        </form>
      )}

      {items.length === 0 ? (
        <p className="empty-state-mini">No habits yet — add one to get started.</p>
      ) : (
        <ul className="habits-grid">
          {items.map((item) => {
            const pending = pendingId === item.id;
            return (
              <li key={item.id} className="lists-card habits-card">
                <button
                  type="button"
                  className={item.doneToday ? "check-toggle check-toggle-done" : "check-toggle"}
                  disabled={pending}
                  onClick={() => handleToggleDone(item.id)}
                  aria-label={
                    item.doneToday ? `Un-mark ${item.name} for today` : `Mark ${item.name} done for today`
                  }
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
                    check
                  </span>
                </button>
                <div className="lists-card-text">
                  <h3 className="lists-card-title">{item.name}</h3>
                  <div className="lists-card-meta">
                    <span className="chip">{item.frequency}</span>
                    {item.streak > 0 && (
                      <span>
                        {item.streak} day{item.streak === 1 ? "" : "s"} streak
                      </span>
                    )}
                  </div>
                  {errorId === item.id && (
                    <p className="status status-error" role="status">
                      Couldn&apos;t update — try again
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        className="fab"
        onClick={() => setFormOpen((open) => !open)}
        aria-label={formOpen ? "Close add habit form" : "Add habit"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
          {formOpen ? "close" : "add"}
        </span>
      </button>
    </div>
  );
}
