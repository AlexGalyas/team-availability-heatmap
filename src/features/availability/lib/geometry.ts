// Pure geometry of the local display grid: which weekdays/hours exist and how to
// key a local cell. No time-zone math here — see `./time.ts`.

import type { LocalCell, Weekday } from "../model/types";

/** Local display weekdays, Mon–Fri (ISO order). */
export const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5];

/** Short Ukrainian labels for the weekday columns. */
export const WEEKDAY_LABELS: Readonly<Record<Weekday, string>> = {
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
};

/** Full Ukrainian weekday names, for accessible cell labels. */
export const WEEKDAY_FULL_LABELS: Readonly<Record<Weekday, string>> = {
  1: "Понеділок",
  2: "Вівторок",
  3: "Середа",
  4: "Четвер",
  5: "Пʼятниця",
};

/** Format a display hour as `HH:00` (e.g. `8` → `"08:00"`). */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** First local display hour, inclusive (08:00). */
export const START_HOUR = 8;

/** Upper bound of the display window, exclusive (20:00). Last cell is 19:00–20:00. */
export const END_HOUR = 20;

/** Local display hours as cell starts: [8, 9, …, 19] (12 entries). */
export const HOURS: readonly number[] = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

/** Stable key for a local cell, e.g. `"1-8"` (weekday-hour). For React keys/lookups. */
export function localCellKey(weekday: Weekday, hour: number): string {
  return `${weekday}-${hour}`;
}

/** DOM id for a cell's button, used for imperative roving focus, e.g. `"avail-cell-1-8"`. */
export function cellDomId(weekday: Weekday, hour: number): string {
  return `avail-cell-${weekday}-${hour}`;
}

/** Every local cell in row-major (weekday × hour) order — 5 × 12 = 60 cells. */
export function allLocalCells(): LocalCell[] {
  const cells: LocalCell[] = [];
  for (const weekday of WEEKDAYS) {
    for (const hour of HOURS) {
      cells.push({ weekday, hour });
    }
  }
  return cells;
}

/** Is `hour` within the local display window [START_HOUR, END_HOUR)? */
export function isDisplayHour(hour: number): boolean {
  return hour >= START_HOUR && hour < END_HOUR;
}
