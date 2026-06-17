// Request DTOs for the mock API + runtime guards. Bodies arrive as `unknown` and
// are narrowed here (never `any`), so handlers stay type-safe end to end.

import type { RecurringRule, SlotKey } from "../model/types";

export interface PutAvailabilityBody {
  memberId: string;
  slots: SlotKey[];
}

export interface RecurringRuleBody {
  memberId: string;
  rule: RecurringRule;
  /** Client UTC offset in whole hours, used to expand the local rule to UTC. */
  offsetHours: number;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** A canonical UTC slot key: ISO weekday (1–7) + hour (0–23), e.g. `"3-14"`. */
export function isSlotKey(v: unknown): v is SlotKey {
  return typeof v === "string" && /^[1-7]-(?:[0-9]|1[0-9]|2[0-3])$/.test(v);
}

function isRecurringRule(v: unknown): v is RecurringRule {
  if (!isRecord(v)) return false;
  const { weekday, startHour, endHour } = v;
  return (
    typeof weekday === "number" &&
    weekday >= 1 &&
    weekday <= 5 &&
    typeof startHour === "number" &&
    typeof endHour === "number"
  );
}

export function isPutAvailabilityBody(v: unknown): v is PutAvailabilityBody {
  if (!isRecord(v)) return false;
  return (
    typeof v.memberId === "string" &&
    Array.isArray(v.slots) &&
    v.slots.every(isSlotKey)
  );
}

export function isRecurringRuleBody(v: unknown): v is RecurringRuleBody {
  if (!isRecord(v)) return false;
  return (
    typeof v.memberId === "string" &&
    typeof v.offsetHours === "number" &&
    isRecurringRule(v.rule)
  );
}
