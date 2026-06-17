// Expand a local recurring rule into canonical UTC slot keys.

import type { RecurringRule, SlotKey } from "../model/types";
import { END_HOUR, START_HOUR } from "./geometry";
import { localCellToSlotKey } from "./time";

/**
 * Expand a recurring weekly rule into the UTC slot keys it covers.
 *
 * Hours are the half-open range `[startHour, endHour)` (endHour exclusive) and are
 * clamped to the display window [START_HOUR, END_HOUR). Returns `[]` for an empty or
 * inverted range (`endHour <= startHour`) — validation lives in the form (T8).
 */
export function expandRecurringRule(
  rule: RecurringRule,
  offsetHours: number,
): SlotKey[] {
  const start = Math.max(rule.startHour, START_HOUR);
  const end = Math.min(rule.endHour, END_HOUR);

  const keys: SlotKey[] = [];
  for (let hour = start; hour < end; hour++) {
    keys.push(localCellToSlotKey(rule.weekday, hour, offsetHours));
  }
  return keys;
}
