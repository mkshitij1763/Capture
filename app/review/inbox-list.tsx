"use client";

import { useState } from "react";

type CaptureTypeName = "task" | "reference" | "thought" | "shopping";
type AgeBucket = "neutral" | "amber" | "red";

export type InboxItem = {
  id: string;
  type: CaptureTypeName | null;
  content: string;
  tags: string[];
  typeSpecificData: Record<string, unknown>;
  createdAt: string;
  ageBucket: AgeBucket;
};

const AGE_ICON: Record<AgeBucket, string> = {
  neutral: "schedule",
  amber: "history",
  red: "warning",
};

function formatAge(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(hours / 24);
  if (hours < 1) return "Added just now";
  if (days < 1) return `Added ${hours} hour${hours === 1 ? "" : "s"} ago`;
  return `${days} day${days === 1 ? "" : "s"} old`;
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
    return (
      <section className="empty-state">
        <h3 className="empty-state-title">Mind like water</h3>
        <p className="empty-state-copy">Your inbox is clear. Take a moment to enjoy the stillness.</p>
      </section>
    );
  }

  return (
    <ul className="review-list">
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const pending = pendingId === item.id;
        const sourceUrl =
          item.type === "reference" && typeof item.typeSpecificData?.source_url === "string"
            ? (item.typeSpecificData.source_url as string)
            : null;

        return (
          <li key={item.id} className={`review-card review-card-${item.ageBucket}`}>
            <button
              type="button"
              className="review-card-main"
              onClick={() => toggleExpanded(item.id)}
              aria-expanded={expanded}
            >
              <div className="review-card-text">
                <h3 className="review-card-content">{item.content}</h3>
                <div className={`review-card-age review-card-age-${item.ageBucket}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden="true">
                    {AGE_ICON[item.ageBucket]}
                  </span>
                  <span>{formatAge(item.createdAt)}</span>
                  {item.type && <span className="chip">{item.type}</span>}
                </div>
              </div>
              <span className="material-symbols-outlined review-card-chevron" aria-hidden="true">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>

            {expanded && (
              <div className="quick-actions">
                {sourceUrl && (
                  <a href={sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                      open_in_new
                    </span>
                    <span>{sourceUrl}</span>
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
                        className="btn-primary"
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
                        className="btn-primary"
                        disabled={pending}
                        onClick={() => {
                          setSchedulingId(item.id);
                          setScheduledDate(new Date().toISOString().slice(0, 10));
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                          calendar_today
                        </span>
                        Schedule
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        disabled={pending}
                        onClick={() => runAction(item.id, "drop")}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                          delete_sweep
                        </span>
                        Drop
                      </button>
                    </div>
                  ))}

                {item.type === "reference" && (
                  <div className="quick-actions-row">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pending}
                      onClick={() => runAction(item.id, "save")}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        bookmark_added
                      </span>
                      Save
                    </button>
                  </div>
                )}

                {item.type === "thought" && (
                  <div className="quick-actions-row">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pending}
                      onClick={() => runAction(item.id, "archive")}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        archive
                      </span>
                      Archive
                    </button>
                  </div>
                )}

                {item.type === "shopping" && (
                  <div className="quick-actions-row">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={pending}
                      onClick={() => runAction(item.id, "bought")}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                        shopping_bag
                      </span>
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
