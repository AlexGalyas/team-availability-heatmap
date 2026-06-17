// Heatmap computation: how many members are free in each LOCAL grid cell.
//
// Members store UTC slots; we project each onto the local grid (skipping any that
// fall on the weekend / outside the display window) and count overlaps. `max` is the
// team size, so intensity = count / max and "everyone free" reads as full intensity.

import { useMemo } from "react";
import { localCellKey } from "../lib/geometry";
import { parseSlotKey, toLocalCell } from "../lib/time";
import type { MemberAvailability, Weekday } from "../model/types";

export interface Heatmap {
  /** localCellKey → number of free members. */
  counts: ReadonlyMap<string, number>;
  /** Denominator for intensity — the team size. */
  max: number;
  countFor: (weekday: Weekday, hour: number) => number;
  /** count / max, clamped to [0, 1]; 0 when there are no members. */
  intensityFor: (weekday: Weekday, hour: number) => number;
}

export function computeHeatmap(
  availability: readonly MemberAvailability[],
  memberCount: number,
  offsetHours: number,
): Heatmap {
  const counts = new Map<string, number>();

  for (const member of availability) {
    const seen = new Set<string>();
    for (const key of member.slots) {
      const cell = toLocalCell(parseSlotKey(key), offsetHours);
      if (!cell) continue;
      const ck = localCellKey(cell.weekday, cell.hour);
      if (seen.has(ck)) continue; // dedupe within a member
      seen.add(ck);
      counts.set(ck, (counts.get(ck) ?? 0) + 1);
    }
  }

  const max = Math.max(memberCount, 0);
  const countFor = (weekday: Weekday, hour: number): number =>
    counts.get(localCellKey(weekday, hour)) ?? 0;
  const intensityFor = (weekday: Weekday, hour: number): number =>
    max === 0 ? 0 : countFor(weekday, hour) / max;

  return { counts, max, countFor, intensityFor };
}

export function useHeatmap(
  availability: readonly MemberAvailability[],
  memberCount: number,
  offsetHours: number,
): Heatmap {
  return useMemo(
    () => computeHeatmap(availability, memberCount, offsetHours),
    [availability, memberCount, offsetHours],
  );
}
