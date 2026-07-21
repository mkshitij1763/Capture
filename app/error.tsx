"use client";

import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main className="shell-page">
      <section className="shell-header">
        <h1 className="shell-title">Something went wrong</h1>
        <p className="shell-subtitle">{error.message || "An unexpected error occurred."}</p>
      </section>
      <button type="button" className="btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
