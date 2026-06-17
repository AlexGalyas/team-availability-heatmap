import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MemberAvailability } from "../model/types";
import { computeHeatmap, useHeatmap } from "./useHeatmap";

const availability: MemberAvailability[] = [
  { memberId: "a", slots: ["1-9", "1-10"] },
  { memberId: "b", slots: ["1-9"] },
  { memberId: "c", slots: ["6-9"] }, // Saturday UTC → off-grid at offset 0
];

describe("computeHeatmap", () => {
  it("counts free members per local cell", () => {
    const h = computeHeatmap(availability, 3, 0);
    expect(h.countFor(1, 9)).toBe(2);
    expect(h.countFor(1, 10)).toBe(1);
    expect(h.countFor(2, 9)).toBe(0);
  });

  it("uses the team size as max", () => {
    expect(computeHeatmap(availability, 3, 0).max).toBe(3);
  });

  it("skips slots that fall outside the local grid", () => {
    // Member c's only slot is Saturday UTC → contributes to no Mon–Fri cell.
    const h = computeHeatmap(availability, 3, 0);
    let total = 0;
    for (const count of h.counts.values()) total += count;
    expect(total).toBe(3); // 2 (1-9) + 1 (1-10); the Saturday slot is dropped
  });

  it("computes intensity as count / max and guards against zero members", () => {
    const h = computeHeatmap(availability, 3, 0);
    expect(h.intensityFor(1, 9)).toBeCloseTo(2 / 3);
    expect(computeHeatmap([], 0, 0).intensityFor(1, 9)).toBe(0);
  });

  it("dedupes duplicate slots within a single member", () => {
    const dup: MemberAvailability[] = [{ memberId: "a", slots: ["1-9", "1-9"] }];
    expect(computeHeatmap(dup, 1, 0).countFor(1, 9)).toBe(1);
  });

  it("reprojects cells when the offset shifts the local weekday", () => {
    // "7-18" (Sun 18:00 UTC) maps to Mon 08:00 local at offset +14.
    const h = computeHeatmap([{ memberId: "a", slots: ["7-18"] }], 1, 14);
    expect(h.countFor(1, 8)).toBe(1);
  });
});

describe("useHeatmap", () => {
  it("memoizes the computation across re-renders with stable inputs", () => {
    const { result, rerender } = renderHook(
      ({ a, m, o }) => useHeatmap(a, m, o),
      { initialProps: { a: availability, m: 3, o: 0 } },
    );
    const first = result.current;
    rerender({ a: availability, m: 3, o: 0 });
    expect(result.current).toBe(first);
  });
});
