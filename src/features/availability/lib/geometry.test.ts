import { describe, expect, it } from "vitest";
import {
  allLocalCells,
  END_HOUR,
  HOURS,
  isDisplayHour,
  localCellKey,
  START_HOUR,
  WEEKDAYS,
} from "./geometry";

describe("geometry", () => {
  it("exposes Mon–Fri weekdays", () => {
    expect(WEEKDAYS).toEqual([1, 2, 3, 4, 5]);
  });

  it("exposes display hours 08–19 (12 cells)", () => {
    expect(HOURS[0]).toBe(START_HOUR);
    expect(HOURS).toHaveLength(END_HOUR - START_HOUR);
    expect(HOURS).toHaveLength(12);
    expect(HOURS.at(-1)).toBe(19);
  });

  it("enumerates 5 × 12 = 60 local cells in row-major order", () => {
    const cells = allLocalCells();
    expect(cells).toHaveLength(60);
    expect(cells[0]).toEqual({ weekday: 1, hour: START_HOUR });
    expect(cells.at(-1)).toEqual({ weekday: 5, hour: 19 });
  });

  it("keys a local cell as weekday-hour", () => {
    expect(localCellKey(3, 14)).toBe("3-14");
  });

  it("recognises the display window bounds", () => {
    expect(isDisplayHour(START_HOUR)).toBe(true);
    expect(isDisplayHour(19)).toBe(true);
    expect(isDisplayHour(END_HOUR)).toBe(false);
    expect(isDisplayHour(7)).toBe(false);
  });
});
