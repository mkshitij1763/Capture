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

const TAB_LABEL: Record<Tab, string> = {
  tasks: "Tasks",
  references: "References",
  shopping: "Shopping",
};

function formatScheduledDate(value: string | null): string {
  if (!value) return "No date";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  async function handleComplete(id: string, action: "done" | "bought", remove: (id: string) => void) {
    setCompletingId(id);
    setErrorId(null);
    try {
      await transition(id, action);
      window.setTimeout(() => {
        remove(id);
        setCompletingId(null);
      }, 350);
    } catch {
      setCompletingId(null);
      setErrorId(id);
    }
  }

  return (
    <div className="lists-tabs">
      <div className="tabs" role="tablist">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "tab tab-active" : "tab"}
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      {tab === "tasks" &&
        (tasks.length === 0 ? (
          <p className="empty-state-mini">No scheduled tasks.</p>
        ) : (
          <ul className="lists-items">
            {tasks.map((item) => {
              const completing = completingId === item.id;
              return (
                <li key={item.id} className="lists-card">
                  <button
                    type="button"
                    className={completing ? "check-toggle check-toggle-done" : "check-toggle"}
                    disabled={completing}
                    onClick={() =>
                      handleComplete(item.id, "done", (id) =>
                        setTasks((current) => current.filter((task) => task.id !== id))
                      )
                    }
                    aria-label="Mark done"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
                      check
                    </span>
                  </button>
                  <div className="lists-card-text">
                    <h3 className={completing ? "lists-card-title lists-card-title-done" : "lists-card-title"}>
                      {item.content}
                    </h3>
                    <div className="lists-card-meta">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
                        calendar_today
                      </span>
                      <span>{formatScheduledDate(item.scheduledDate)}</span>
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
        ))}

      {tab === "references" &&
        (references.length === 0 ? (
          <p className="empty-state-mini">No saved references.</p>
        ) : (
          <ul className="lists-items">
            {references.map((item) => (
              <li key={item.id} className="lists-card lists-card-static">
                <div className="lists-card-text">
                  <div className="lists-card-title-row">
                    <h3 className="lists-card-title">{item.content}</h3>
                    {item.sourceType && <span className="chip">{item.sourceType}</span>}
                  </div>
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                        open_in_new
                      </span>
                      <span>{item.sourceUrl}</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "shopping" &&
        (shopping.length === 0 ? (
          <p className="empty-state-mini">Shopping list is empty.</p>
        ) : (
          <ul className="lists-items">
            {shopping.map((item) => {
              const completing = completingId === item.id;
              return (
                <li key={item.id} className="lists-card">
                  <button
                    type="button"
                    className={completing ? "check-toggle check-toggle-done" : "check-toggle"}
                    disabled={completing}
                    onClick={() =>
                      handleComplete(item.id, "bought", (id) =>
                        setShopping((current) => current.filter((entry) => entry.id !== id))
                      )
                    }
                    aria-label="Mark bought"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
                      check
                    </span>
                  </button>
                  <div className="lists-card-text">
                    <h3 className={completing ? "lists-card-title lists-card-title-done" : "lists-card-title"}>
                      {item.content}
                    </h3>
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
        ))}
    </div>
  );
}
