// In-memory mock store for the availability feature.
//
// Source of truth during a dev session. Imported by both the route handlers
// (client data path via RTK Query) and Server Components (first paint / SSR).
// The state is module-level and RESETS on server restart / HMR — accepted for the
// MVP; the client mirrors its own layer to localStorage as a backstop (T7).
//
// Availability is stored canonically in UTC (`SlotKey`s). The mutation logic is
// factored into PURE functions over an `AvailabilityState` value so it can be
// unit-tested without touching module state.

import { expandRecurringRule } from "../lib/recurring";
import type {
  IsoWeekday,
  Member,
  MemberAvailability,
  RecurringRule,
  SlotKey,
} from "../model/types";

/** Map of memberId → their UTC slot keys. */
export type AvailabilityState = Record<string, SlotKey[]>;

// ── Pure logic ──────────────────────────────────────────────────────────────

function dedupe(slots: SlotKey[]): SlotKey[] {
  return Array.from(new Set(slots));
}

/** Replace a member's entire layer with `slots` (deduped). Other members untouched. */
export function setMemberSlots(
  state: AvailabilityState,
  memberId: string,
  slots: SlotKey[],
): AvailabilityState {
  return { ...state, [memberId]: dedupe(slots) };
}

/**
 * Merge a recurring rule into a member's existing layer (union, deduped).
 * The rule is local; `offsetHours` converts it to canonical UTC slot keys.
 */
export function applyRuleToState(
  state: AvailabilityState,
  memberId: string,
  rule: RecurringRule,
  offsetHours: number,
): AvailabilityState {
  const existing = state[memberId] ?? [];
  const added = expandRecurringRule(rule, offsetHours);
  return { ...state, [memberId]: dedupe([...existing, ...added]) };
}

// ── Seed ─────────────────────────────────────────────────────────────────────

const SEED_MEMBERS: readonly Member[] = [
  { id: "m1", name: "Олена" },
  { id: "m2", name: "Богдан" },
  { id: "m3", name: "Світлана" },
  { id: "m4", name: "Дмитро" },
  { id: "m5", name: "Ірина" },
  { id: "m6", name: "Тарас" },
];

/** Build a contiguous run of UTC slot keys for one weekday, `[startHour, endHour)`. */
function utcRange(
  weekday: IsoWeekday,
  startHour: number,
  endHour: number,
): SlotKey[] {
  const keys: SlotKey[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    keys.push(`${weekday}-${hour}`);
  }
  return keys;
}

function createSeedState(): AvailabilityState {
  return {
    m1: [...utcRange(1, 9, 12), ...utcRange(3, 14, 17)],
    m2: [...utcRange(1, 10, 13), ...utcRange(2, 9, 11)],
    m3: [...utcRange(1, 9, 11), ...utcRange(3, 15, 18), ...utcRange(5, 8, 10)],
    m4: [...utcRange(2, 14, 16), ...utcRange(4, 9, 12)],
    m5: [...utcRange(1, 9, 10), ...utcRange(3, 16, 18)],
    m6: [...utcRange(5, 13, 16)],
  };
}

// ── Stateful module instance ──────────────────────────────────────────────────

const members: readonly Member[] = SEED_MEMBERS;
let availability: AvailabilityState = createSeedState();

export function getMembers(): Member[] {
  return members.map((m) => ({ ...m }));
}

export function getAllAvailability(): MemberAvailability[] {
  return Object.entries(availability).map(([memberId, slots]) => ({
    memberId,
    slots: [...slots],
  }));
}

/** Replace the caller's layer and return the full updated state. */
export function putMyAvailability(
  memberId: string,
  slots: SlotKey[],
): MemberAvailability[] {
  availability = setMemberSlots(availability, memberId, slots);
  return getAllAvailability();
}

/** Apply a recurring rule to the caller's layer and return the full updated state. */
export function applyRecurringRule(
  memberId: string,
  rule: RecurringRule,
  offsetHours: number,
): MemberAvailability[] {
  availability = applyRuleToState(availability, memberId, rule, offsetHours);
  return getAllAvailability();
}
