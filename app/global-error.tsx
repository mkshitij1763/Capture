"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  // This replaces the entire root layout when the layout itself throws,
  // so it has to render its own <html>/<body> — can't rely on globals.css
  // classes since that stylesheet may not be what failed.
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1>Something went wrong</h1>
        <p>{error.message || "An unexpected error occurred."}</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", fontSize: "1rem" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
