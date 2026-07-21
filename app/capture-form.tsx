"use client";

import { useRef, useState, type FormEvent } from "react";

type Status = "idle" | "saved" | "error";

export function CaptureForm() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <form className="capture-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setStatus("idle");
        }}
        placeholder="Capture anything..."
        autoFocus
        rows={4}
      />
      <button type="submit" disabled={!value.trim()}>
        Send
      </button>
      {status === "saved" && (
        <p className="status status-saved" role="status">
          Saved
        </p>
      )}
      {status === "error" && (
        <p className="status status-error" role="status">
          Couldn&apos;t save — try again
        </p>
      )}
    </form>
  );
}
