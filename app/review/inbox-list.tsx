"use client";

import { useState } from "react";

type CaptureTypeName = "task" | "reference" | "thought" | "shopping";

export type InboxItem = {
  id: string;
  type: CaptureTypeName | null;
  content: string;
  tags: string[];
  typeSpecificData: Record<string, unknown>;
  createdAt: string;
  ageBucket: "neutral" | "amber" | "red";
};

function formatAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function InboxList({ items: initialItems }: { items: InboxItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? null : id));
    setSchedulingId(null);
    setErrorId(null);
  }

  async function runAction(id: string, action: string, extra?: Record<string, unknown>) {
    setPendingId(id);
    setErrorId(null);
    try {
      const res = await fetch(`/api/captures/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error("transition failed");
      setItems((current) => current.filter((item) => item.id !== id));
      setExpandedId(null);
      setSchedulingId(null);
    } catch {
      setErrorId(id);
    } finally {
      setPendingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="empty-state">Inbox is empty. Nice.</p>;
  }

  return (
    <ul className="inbox-list">
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const pending = pendingId === item.id;
        const sourceUrl =
          item.type === "reference" && typeof item.typeSpecificData?.source_url === "string"
            ? (item.typeSpecificData.source_url as string)
            : null;

        return (
          <li key={item.id} className={`inbox-item age-${item.ageBucket}`}>
            <button
              type="button"
              className="inbox-item-main"
              onClick={() => toggleExpanded(item.id)}
              aria-expanded={expanded}
            >
              <span className="inbox-item-content">{item.content}</span>
              <span className="inbox-item-meta">
                <span className={`age-badge age-badge-${item.ageBucket}`}>
                  {formatAge(item.createdAt)}
                </span>
                <span className="type-badge">{item.type ?? "tagging…"}</span>
              </span>
            </button>

            {expanded && (
              <div className="quick-actions">
                {sourceUrl && (
                  <a href={sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                    {sourceUrl}
                  </a>
                )}

                {item.type === null && (
                  <p className="quick-actions-note">Still tagging — check back shortly.</p>
                )}

                {item.type === "task" &&
                  (schedulingId === item.id ? (
                    <div className="quick-actions-row">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(event) => setScheduledDate(event.target.value)}
                        className="date-input"
                      />
                      <button
                        type="button"
                        disabled={!scheduledDate || pending}
                        onClick={() => runAction(item.id, "schedule", { scheduledDate })}
                      >
                        Confirm
                      </button>
                    </div>
                  ) : (
                    <div className="quick-actions-row">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          setSchedulingId(item.id);
                          setScheduledDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        Schedule
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={pending}
                        onClick={() => runAction(item.id, "drop")}
                      >
                        Drop
                      </button>
                    </div>
                  ))}

                {item.type === "reference" && (
                  <div className="quick-actions-row">
                    <button type="button" disabled={pending} onClick={() => runAction(item.id, "save")}>
                      Save
                    </button>
                  </div>
                )}

                {item.type === "thought" && (
                  <div className="quick-actions-row">
                    <button type="button" disabled={pending} onClick={() => runAction(item.id, "archive")}>
                      Archive
                    </button>
                  </div>
                )}

                {item.type === "shopping" && (
                  <div className="quick-actions-row">
                    <button type="button" disabled={pending} onClick={() => runAction(item.id, "bought")}>
                      Mark bought
                    </button>
                  </div>
                )}

                {errorId === item.id && (
                  <p className="status status-error" role="status">
                    Couldn&apos;t update — try again
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
