// Domain model for the team availability heatmap.
//
// Two coordinate systems live here on purpose:
//  - LOCAL (what the user sees/paints): Mon–Fri, display hours. Uses `Weekday`.
//  - UTC (what we store canonically): any ISO weekday + hour 0–23. Uses `IsoWeekday`.
// Conversion between them is done by the pure functions in `../lib/time.ts`.

/** Local display weekday, ISO Mon–Fri (1 = Mon … 5 = Fri). The grid shows only these. */
export type Weekday = 1 | 2 | 3 | 4 | 5;

/**
 * Full ISO weekday (1 = Mon … 7 = Sun). A UTC slot can land on any day once the
 * local→UTC offset carry crosses a midnight boundary, so storage needs the wider range.
 */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** A stored availability slot, in UTC: ISO weekday + hour-of-day in [0, 23]. */
export interface Slot {
  weekday: IsoWeekday;
  /** UTC hour, 0–23. */
  hour: number;
}

/** Canonical string key for a UTC slot, e.g. `"3-14"` (weekday-hour). */
export type SlotKey = `${IsoWeekday}-${number}`;

/** A local grid cell — what the user actually paints and sees. */
export interface LocalCell {
  weekday: Weekday;
  /** Local hour within the display window. */
  hour: number;
}

export interface Member {
  id: string;
  name: string;
}

/** One member's availability: the set of UTC slots they are free. */
export interface MemberAvailability {
  memberId: string;
  slots: SlotKey[];
}

/**
 * A recurring weekly rule, expressed in LOCAL coordinates.
 * Hours are a half-open range `[startHour, endHour)` — `endHour` is exclusive.
 */
export interface RecurringRule {
  weekday: Weekday;
  /** Local hour, inclusive. */
  startHour: number;
  /** Local hour, exclusive. */
  endHour: number;
}
