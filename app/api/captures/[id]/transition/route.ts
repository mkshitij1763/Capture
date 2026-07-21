import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CaptureType } from "@/generated/prisma/enums";
import type { InputJsonValue } from "@prisma/client/runtime/client";

const ACTIONS = ["schedule", "drop", "save", "archive", "bought"] as const;
type Action = (typeof ACTIONS)[number];

const ACTION_TYPE: Record<Action, CaptureType> = {
  schedule: CaptureType.task,
  drop: CaptureType.task,
  save: CaptureType.reference,
  archive: CaptureType.thought,
  bought: CaptureType.shopping,
};

function isAction(value: unknown): value is Action {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (!isAction(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const capture = await prisma.capture.findUnique({ where: { id } });
  if (!capture) {
    return NextResponse.json({ error: "capture not found" }, { status: 404 });
  }

  if (capture.type !== ACTION_TYPE[action]) {
    return NextResponse.json(
      { error: `action "${action}" is not valid for type "${capture.type}"` },
      { status: 400 }
    );
  }

  const existingData = (capture.typeSpecificData ?? {}) as Record<string, unknown>;
  let status: string;
  let typeSpecificData: InputJsonValue;

  switch (action) {
    case "schedule": {
      const scheduledDate = body?.scheduledDate;
      if (typeof scheduledDate !== "string" || !scheduledDate) {
        return NextResponse.json(
          { error: "scheduledDate is required to schedule a task" },
          { status: 400 }
        );
      }
      status = "scheduled";
      typeSpecificData = {
        ...existingData,
        scheduled_date: scheduledDate,
        done_at: (existingData.done_at as string | null) ?? null,
      };
      break;
    }
    case "drop": {
      status = "dropped";
      typeSpecificData = {
        ...existingData,
        scheduled_date: (existingData.scheduled_date as string | null) ?? null,
        done_at: (existingData.done_at as string | null) ?? null,
      };
      break;
    }
    case "save": {
      status = "saved";
      typeSpecificData = existingData as InputJsonValue;
      break;
    }
    case "archive": {
      status = "archived";
      typeSpecificData = existingData as InputJsonValue;
      break;
    }
    case "bought": {
      status = "bought";
      typeSpecificData = { ...existingData, bought_at: new Date().toISOString() };
      break;
    }
  }

  const updated = await prisma.capture.update({
    where: { id },
    data: { status, typeSpecificData },
  });

  return NextResponse.json(updated);
}
