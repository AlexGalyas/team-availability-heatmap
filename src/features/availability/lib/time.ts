// Pure UTC <-> local conversion for availability slots.
//
// Model: `local = UTC + offsetHours`, with a FIXED whole-hour offset (DST ignored — MVP).
// Day/week boundaries carry correctly (mod 24 for the hour, ±day shift mod 7 for the
// weekday). All functions are pure; the offset is always passed in for testability.

import type { IsoWeekday, LocalCell, Slot, SlotKey, Weekday } from "../model/types";
import { END_HOUR, START_HOUR } from "./geometry";

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

/** Euclidean modulo — always returns a non-negative result. */
function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * The current machine's UTC offset in whole hours (e.g. +3 for Kyiv).
 * `Date#getTimezoneOffset` returns `UTC - local` in minutes, hence the negation.
 * DST is intentionally ignored for the MVP. Call client-side only.
 */
export function getLocalOffsetHours(): number {
  return -(new Date().getTimezoneOffset() / 60);
}

/** Convert a UTC `Slot` to its canonical key, e.g. `"3-14"`. */
export function slotKey(slot: Slot): SlotKey {
  return `${slot.weekday}-${slot.hour}`;
}

/** Parse a canonical `SlotKey` back into a `Slot`. */
export function parseSlotKey(key: SlotKey): Slot {
  const [weekday, hour] = key.split("-");
  return { weekday: Number(weekday) as IsoWeekday, hour: Number(hour) };
}

/**
 * Convert a LOCAL cell (weekday 1–5, local hour) to a canonical UTC `Slot`.
 * Carries across midnight/week boundaries: e.g. Mon 08:00 at offset +14 → Sun 18:00 UTC.
 */
export function toUtcSlot(
  weekday: Weekday,
  localHour: number,
  offsetHours: number,
): Slot {
  // UTC = local - offset
  const totalUtcHour = localHour - offsetHours;
  const dayShift = Math.floor(totalUtcHour / HOURS_PER_DAY);
  const utcHour = mod(totalUtcHour, HOURS_PER_DAY);
  const utcWeekday = (mod(weekday - 1 + dayShift, DAYS_PER_WEEK) + 1) as IsoWeekday;
  return { weekday: utcWeekday, hour: utcHour };
}

/**
 * Convert a UTC `Slot` to the LOCAL cell it falls on, or `null` if that cell lies
 * outside the display grid (Sat/Sun, or outside the [START_HOUR, END_HOUR) window).
 * Such slots are hidden — a documented MVP limitation.
 */
export function toLocalCell(slot: Slot, offsetHours: number): LocalCell | null {
  // local = UTC + offset
  const totalLocalHour = slot.hour + offsetHours;
  const dayShift = Math.floor(totalLocalHour / HOURS_PER_DAY);
  const localHour = mod(totalLocalHour, HOURS_PER_DAY);
  const localWeekday = mod(slot.weekday - 1 + dayShift, DAYS_PER_WEEK) + 1;

  if (localWeekday < 1 || localWeekday > 5) return null;
  if (localHour < START_HOUR || localHour >= END_HOUR) return null;

  return { weekday: localWeekday as Weekday, hour: localHour };
}

/** Convenience: local cell → canonical UTC slot key. */
export function localCellToSlotKey(
  weekday: Weekday,
  localHour: number,
  offsetHours: number,
): SlotKey {
  return slotKey(toUtcSlot(weekday, localHour, offsetHours));
}
