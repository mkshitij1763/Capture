import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { InboxList, type InboxItem } from "./inbox-list";

// Always hits the DB fresh — this is a live inbox, not something to
// prerender/cache at build time.
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function ageBucket(createdAt: Date): "neutral" | "amber" | "red" {
  const ageDays = (Date.now() - createdAt.getTime()) / DAY_MS;
  if (ageDays >= 7) return "red";
  if (ageDays >= 3) return "amber";
  return "neutral";
}

export default async function ReviewPage() {
  const captures = await prisma.capture.findMany({
    where: { status: "inbox" },
    orderBy: { createdAt: "asc" },
  });

  const items: InboxItem[] = captures.map((capture) => ({
    id: capture.id,
    type: capture.type,
    content: capture.content,
    tags: capture.tags,
    typeSpecificData: capture.typeSpecificData as Record<string, unknown>,
    createdAt: capture.createdAt.toISOString(),
    ageBucket: ageBucket(capture.createdAt),
  }));

  return (
    <main className="shell-page">
      <section className="shell-header">
        <h1 className="shell-title">Review</h1>
        <p className="shell-subtitle">Triage your thoughts into action.</p>
      </section>
      <InboxList items={items} />
      <Link href="/" className="fab" aria-label="New capture">
        <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
          add_circle
        </span>
      </Link>
    </main>
  );
}
