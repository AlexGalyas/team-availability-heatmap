import { describe, expect, it } from "vitest";
import type { RecurringRule } from "../model/types";
import { expandRecurringRule } from "./recurring";

const rule = (
  weekday: RecurringRule["weekday"],
  startHour: number,
  endHour: number,
): RecurringRule => ({ weekday, startHour, endHour });

describe("expandRecurringRule", () => {
  it("expands a half-open hour range at offset 0", () => {
    // 09:00–12:00 → three one-hour slots (12:00 exclusive)
    expect(expandRecurringRule(rule(2, 9, 12), 0)).toEqual(["2-9", "2-10", "2-11"]);
  });

  it("returns an empty array for an inverted or empty range", () => {
    expect(expandRecurringRule(rule(2, 12, 12), 0)).toEqual([]);
    expect(expandRecurringRule(rule(2, 14, 9), 0)).toEqual([]);
  });

  it("clamps the range to the display window", () => {
    const keys = expandRecurringRule(rule(1, 6, 23), 0);
    expect(keys).toHaveLength(12); // 08..19
    expect(keys[0]).toBe("1-8");
    expect(keys.at(-1)).toBe("1-19");
  });

  it("carries across the week boundary via the offset", () => {
    // Mon 08:00–10:00 local at +14 → previous day (Sun) 18:00, 19:00 UTC
    expect(expandRecurringRule(rule(1, 8, 10), 14)).toEqual(["7-18", "7-19"]);
  });
});
