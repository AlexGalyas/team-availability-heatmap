import { NextResponse } from "next/server";
import { getMembers } from "@/features/availability/server/store";

// Mutable in-memory store — never statically cache.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getMembers());
}
