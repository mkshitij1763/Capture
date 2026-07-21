"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Status = "idle" | "saved" | "error";

export function CaptureForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const content = value.trim();
    if (!content) return;

    setValue("");
    setStatus("idle");
    textareaRef.current?.focus();

    try {
      const res = await fetch("/api/captures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setValue(content);
      setStatus("error");
    }
  }

  return (
    <form className="capture-form" onSubmit={handleSubmit} suppressHydrationWarning>
      <textarea
        ref={textareaRef}
        className="capture-textarea"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setStatus("idle");
        }}
        placeholder="Capture anything..."
        autoFocus
        rows={4}
        suppressHydrationWarning
      />
      <div className="capture-action-row">
        <button type="submit" className="btn-primary" disabled={!value.trim()}>
          <span>Capture</span>
          <span className="material-symbols-outlined" aria-hidden="true">
            arrow_forward
          </span>
        </button>
      </div>
      <p
        className={status === "error" ? "capture-tagline capture-tagline-error" : "capture-tagline"}
        role="status"
      >
        {status === "saved"
          ? "Saved."
          : status === "error"
            ? "Couldn't save — try again"
            : "Your thoughts, safely stored."}
      </p>
    </form>
  );
}
