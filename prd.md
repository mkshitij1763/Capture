
# Capture — Product Spec (v1)

## Core Loop (do not violate this)

1. Open app → one input box → type/paste anything → hit send → done. Zero friction, zero required fields.
2. Capture saves instantly with `status = inbox`, `tags = []`.
3. Background job auto-tags + classifies type within a few seconds (async, non-blocking).
4. Review screen shows inbox items sorted by age, with items older than 3 days visually flagged (color/badge escalation — NOT locked, NOT mandatory, just harder to ignore).
5. User acts on each item at their own pace: moves it to its next state or leaves it.

## Non-goals (explicitly out of scope for v1)

- No priority field on tasks. If it matters, schedule it. If you won't schedule it, it wasn't real.
- No mandatory daily triage lock. No forced review gate.
- No multi-user / sharing / collaboration.
- No native app — PWA only.
- No manual tag correction UI in v1 (revisit only if mis-tagging becomes a real problem).

## Data Model

### Capture (shared table)

```
id
type: 'task' | 'reference' | 'thought' | 'shopping'
content: text
tags: string[] (AI-generated, async)
status: string (see per-type states below)
created_at, updated_at
type_specific_data: JSON
```

### type_specific_data by type

- `task`: `{ scheduled_date: date|null, done_at: timestamp|null }`
  - states: `inbox → scheduled → done` (or `dropped`)
- `reference`: `{ source_url: string|null, source_type: 'reel'|'linkedin'|'quote'|'podcast'|null, revisited_at: timestamp|null }`
  - states: `inbox → saved` (optional `revisited` timestamp)
- `thought`: `{}`
  - states: `inbox → archived`
- `shopping`: `{ bought_at: timestamp|null, category: 'grocery'|'clothes'|'gifts'|'other' }`
  - states: `inbox → bought`

### Habit (separate table — not a Capture)

```
Habit: id, name, frequency ('daily'|'weekly'|'custom'), created_at
HabitLog: id, habit_id, date, completed: bool
```

## Screens (v1)

1. **Capture** (home) — single text input, send button, nothing else. This screen must load instantly.
2. **Review/Inbox** — list of `status = inbox` items across all types, sorted oldest-first, age-based visual escalation (e.g. neutral < 3 days, amber 3-7 days, red 7+ days). Tap item → quick action menu to move to next state.
3. **Lists** — filtered views of Capture by type + status (e.g. "Scheduled tasks", "Saved references", "Shopping list"). These are views/queries, not separate features/tables.
4. **Habits** — simple grid, tap to mark done for today, streak count.

## Tagging

- Async only. Capture never blocks on the AI call.
- On submit: save immediately, status=inbox, tags=[], type=null (or best-guess placeholder).
- Background job (queued) calls the classification model, updates `type` + `tags` + `type_specific_data` fields in place.
- UI reflects the update whenever it lands — no polling spinner, no blocking state.

## Build Phases (for Claude Code sessions — one phase per session, commit to git after each)

**Phase 1 — Data layer**
Prisma schema for Capture + Habit + HabitLog. Migrations. Local DB running.
Mode: Plan mode first (review the schema before accepting). Model: Sonnet, escalate to Opus only if the async-tagging + type_specific_data JSON modeling gets genuinely tricky.

**Phase 2 — Capture input**
The single-box submit screen. Instant save, no blocking. This is the entire value prop — get it right before anything else.
Mode: default/auto mode, well-scoped. Model: Sonnet.

**Phase 3 — Async tagging job**
Background classification job wired to Claude API. Updates capture in place.
Mode: Plan mode for the job architecture (queue vs. cron vs. edge function — worth thinking through once). Model: Sonnet.

**Phase 4 — Review/Inbox screen**
Age-based sorting + visual escalation. Quick-action state transitions.
Mode: default/auto. Model: Sonnet.

**Phase 5 — Lists (filtered views)**
Task list, reference list, shopping list — all queries against Capture, not new tables.
Mode: default/auto, safe to auto-accept most of this (low blast radius). Model: Sonnet.

**Phase 6 — Habits**
Separate table, simple grid UI, streak logic.
Mode: default/auto. Model: Sonnet.

**Phase 7 — PWA polish**
Install prompt, offline support, manifest, icons.
Mode: default/auto, auto-accept fine here (mechanical work). Model: Sonnet or Haiku-tier if you wire in a cheaper model for boilerplate.

## Rules for every Claude Code session

- Reference this file explicitly at the start of each session.
- One phase per session. Don't bundle phases.
- Never auto-accept edits touching the Capture schema or state-transition logic — review those by hand.
- Commit after every working phase. Git is your undo button, not "ask Claude to revert."
- Use `/clear` between unrelated sessions to avoid context rot.
