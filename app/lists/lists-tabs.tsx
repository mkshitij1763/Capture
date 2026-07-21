"use client";

import { useState } from "react";

export type TaskItem = {
  id: string;
  content: string;
  scheduledDate: string | null;
};

export type ReferenceItem = {
  id: string;
  content: string;
  createdAt: string;
  sourceUrl: string | null;
  sourceType: string | null;
};

export type ShoppingItem = {
  id: string;
  content: string;
  createdAt: string;
};

type Tab = "tasks" | "references" | "shopping";

function formatScheduledDate(value: string | null): string {
  if (!value) return "no date";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

async function transition(id: string, action: string) {
  const res = await fetch(`/api/captures/${id}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error("transition failed");
}

export function ListsTabs({
  tasks: initialTasks,
  references,
  shopping: initialShopping,
}: {
  tasks: TaskItem[];
  references: ReferenceItem[];
  shopping: ShoppingItem[];
}) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState(initialTasks);
  const [shopping, setShopping] = useState(initialShopping);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function handleDone(id: string) {
    setPendingId(id);
    setErrorId(null);
    try {
      await transition(id, "done");
      setTasks((current) => current.filter((item) => item.id !== id));
    } catch {
      setErrorId(id);
    } finally {
      setPendingId(null);
    }
  }

  async function handleBought(id: string) {
    setPendingId(id);
    setErrorId(null);
    try {
      await transition(id, "bought");
      setShopping((current) => current.filter((item) => item.id !== id));
    } catch {
      setErrorId(id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="lists-tabs">
      <div className="tab-row" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "tasks"}
          className={tab === "tasks" ? "tab-button active" : "tab-button"}
          onClick={() => setTab("tasks")}
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "references"}
          className={tab === "references" ? "tab-button active" : "tab-button"}
          onClick={() => setTab("references")}
        >
          References
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "shopping"}
          className={tab === "shopping" ? "tab-button active" : "tab-button"}
          onClick={() => setTab("shopping")}
        >
          Shopping
        </button>
      </div>

      {tab === "tasks" && (
        <ul className="list-items">
          {tasks.length === 0 && <p className="empty-state">No scheduled tasks.</p>}
          {tasks.map((item) => (
            <li key={item.id} className="list-item">
              <div className="list-item-main">
                <span className="list-item-content">{item.content}</span>
                <span className="list-item-meta">{formatScheduledDate(item.scheduledDate)}</span>
              </div>
              <div className="list-item-actions">
                <button type="button" disabled={pendingId === item.id} onClick={() => handleDone(item.id)}>
                  Done
                </button>
              </div>
              {errorId === item.id && (
                <p className="status status-error" role="status">
                  Couldn&apos;t update — try again
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "references" && (
        <ul className="list-items">
          {references.length === 0 && <p className="empty-state">No saved references.</p>}
          {references.map((item) => (
            <li key={item.id} className="list-item">
              <div className="list-item-main">
                <span className="list-item-content">{item.content}</span>
                {item.sourceType && <span className="type-badge">{item.sourceType}</span>}
              </div>
              {item.sourceUrl && (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                  {item.sourceUrl}
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {tab === "shopping" && (
        <ul className="list-items">
          {shopping.length === 0 && <p className="empty-state">Shopping list is empty.</p>}
          {shopping.map((item) => (
            <li key={item.id} className="list-item">
              <div className="list-item-main">
                <span className="list-item-content">{item.content}</span>
              </div>
              <div className="list-item-actions">
                <button type="button" disabled={pendingId === item.id} onClick={() => handleBought(item.id)}>
                  Bought
                </button>
              </div>
              {errorId === item.id && (
                <p className="status status-error" role="status">
                  Couldn&apos;t update — try again
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
