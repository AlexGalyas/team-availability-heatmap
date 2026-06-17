import { NextResponse } from "next/server";
import { isPutAvailabilityBody } from "@/features/availability/server/contracts";
import {
  getAllAvailability,
  putMyAvailability,
} from "@/features/availability/server/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getAllAvailability());
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isPutAvailabilityBody(body)) {
    return NextResponse.json(
      { error: "Expected { memberId: string, slots: SlotKey[] }" },
      { status: 400 },
    );
  }

  const updated = putMyAvailability(body.memberId, body.slots);
  return NextResponse.json(updated);
}
