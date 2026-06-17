import { describe, expect, it } from "vitest";
import type { Slot, Weekday } from "../model/types";
import {
  localCellToSlotKey,
  parseSlotKey,
  slotKey,
  toLocalCell,
  toUtcSlot,
} from "./time";

describe("slotKey / parseSlotKey", () => {
  it("round-trips a slot through its canonical key", () => {
    const slot: Slot = { weekday: 3, hour: 14 };
    expect(slotKey(slot)).toBe("3-14");
    expect(parseSlotKey("3-14")).toEqual(slot);
  });
});

describe("toUtcSlot", () => {
  it("is identity at offset 0", () => {
    expect(toUtcSlot(1, 8, 0)).toEqual({ weekday: 1, hour: 8 });
  });

  it("subtracts a positive offset within the same day", () => {
    // Kyiv (+3): Mon 08:00 local → Mon 05:00 UTC
    expect(toUtcSlot(1, 8, 3)).toEqual({ weekday: 1, hour: 5 });
  });

  it("carries backward across the week boundary", () => {
    // Mon 08:00 local at +14 → 08 - 14 = -6 → 18:00 the previous day → Sun (7)
    expect(toUtcSlot(1, 8, 14)).toEqual({ weekday: 7, hour: 18 });
  });

  it("carries forward across a day boundary", () => {
    // Fri 19:00 local at -10 → 19 + 10 = 29 → 05:00 next day → Sat (6)
    expect(toUtcSlot(5, 19, -10)).toEqual({ weekday: 6, hour: 5 });
  });
});

describe("toLocalCell", () => {
  it("is identity at offset 0 inside the window", () => {
    expect(toLocalCell({ weekday: 2, hour: 9 }, 0)).toEqual({
      weekday: 2,
      hour: 9,
    });
  });

  it("round-trips with toUtcSlot for every in-window local cell", () => {
    const offsets = [-12, -10, -3, 0, 3, 8, 14];
    const weekdays: Weekday[] = [1, 2, 3, 4, 5];
    for (const offset of offsets) {
      for (const weekday of weekdays) {
        for (let hour = 8; hour < 20; hour++) {
          const utc = toUtcSlot(weekday, hour, offset);
          expect(toLocalCell(utc, offset)).toEqual({ weekday, hour });
        }
      }
    }
  });

  it("hides slots that fall on the weekend locally", () => {
    // Saturday UTC, offset 0 → outside Mon–Fri
    expect(toLocalCell({ weekday: 6, hour: 10 }, 0)).toBeNull();
  });

  it("hides slots that fall outside the display hours locally", () => {
    expect(toLocalCell({ weekday: 1, hour: 2 }, 0)).toBeNull(); // 02:00 < 08:00
    expect(toLocalCell({ weekday: 1, hour: 21 }, 0)).toBeNull(); // 21:00 >= 20:00
  });
});

describe("localCellToSlotKey", () => {
  it("composes toUtcSlot + slotKey", () => {
    expect(localCellToSlotKey(1, 8, 14)).toBe("7-18");
  });
});
