import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ListsTabs, type TaskItem, type ReferenceItem, type ShoppingItem } from "./lists-tabs";

// Live filtered views over Capture — never prerender/cache at build time.
export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const [tasks, references, shopping] = await Promise.all([
    prisma.capture.findMany({ where: { type: "task", status: "scheduled" } }),
    prisma.capture.findMany({
      where: { type: "reference", status: "saved" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.capture.findMany({
      where: { type: "shopping", status: { not: "bought" } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const taskItems: TaskItem[] = tasks
    .map((capture) => {
      const data = capture.typeSpecificData as Record<string, unknown>;
      return {
        id: capture.id,
        content: capture.content,
        scheduledDate: typeof data.scheduled_date === "string" ? data.scheduled_date : null,
      };
    })
    // scheduled_date lives inside the JSON type_specific_data blob, so it can't be
    // sorted at the DB level — sort here instead. Fine at this scale.
    .sort((a, b) => (a.scheduledDate ?? "").localeCompare(b.scheduledDate ?? ""));

  const referenceItems: ReferenceItem[] = references.map((capture) => {
    const data = capture.typeSpecificData as Record<string, unknown>;
    return {
      id: capture.id,
      content: capture.content,
      createdAt: capture.createdAt.toISOString(),
      sourceUrl: typeof data.source_url === "string" ? data.source_url : null,
      sourceType: typeof data.source_type === "string" ? data.source_type : null,
    };
  });

  const shoppingItems: ShoppingItem[] = shopping.map((capture) => ({
    id: capture.id,
    content: capture.content,
    createdAt: capture.createdAt.toISOString(),
  }));

  return (
    <main className="page page-list">
      <header className="review-header">
        <h1>Lists</h1>
        <div className="nav-row">
          <Link href="/" className="nav-link">
            + New capture
          </Link>
          <Link href="/review" className="nav-link">
            Review inbox
          </Link>
        </div>
      </header>
      <ListsTabs tasks={taskItems} references={referenceItems} shopping={shoppingItems} />
    </main>
  );
}
