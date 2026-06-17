import { NextResponse } from "next/server";
import { isRecurringRuleBody } from "@/features/availability/server/contracts";
import { applyRecurringRule } from "@/features/availability/server/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isRecurringRuleBody(body)) {
    return NextResponse.json(
      {
        error:
          "Expected { memberId: string, rule: RecurringRule, offsetHours: number }",
      },
      { status: 400 },
    );
  }

  const updated = applyRecurringRule(
    body.memberId,
    body.rule,
    body.offsetHours,
  );
  return NextResponse.json(updated);
}
