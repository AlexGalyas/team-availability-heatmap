import { describe, expect, it } from "vitest";
import type { AvailabilityState } from "./store";
import {
  applyRuleToState,
  getAllAvailability,
  getMembers,
  setMemberSlots,
} from "./store";

const base: AvailabilityState = {
  m1: ["1-9", "1-10"],
  m2: ["2-9"],
};

describe("setMemberSlots (replace my layer)", () => {
  it("replaces a member's layer entirely without touching others", () => {
    const next = setMemberSlots(base, "m1", ["3-14", "3-15"]);
    expect(next.m1).toEqual(["3-14", "3-15"]);
    expect(next.m2).toEqual(["2-9"]);
  });

  it("dedupes the incoming slots", () => {
    const next = setMemberSlots(base, "m1", ["3-14", "3-14", "3-15"]);
    expect(next.m1).toEqual(["3-14", "3-15"]);
  });

  it("creates a layer for an unknown member", () => {
    const next = setMemberSlots(base, "m9", ["4-9"]);
    expect(next.m9).toEqual(["4-9"]);
  });

  it("does not mutate the input state", () => {
    setMemberSlots(base, "m1", ["3-14"]);
    expect(base.m1).toEqual(["1-9", "1-10"]);
  });
});

describe("applyRuleToState (merge a rule)", () => {
  it("unions the expanded rule into the existing layer, deduped", () => {
    // Tue 10:00–12:00 local at offset 0 → "2-10", "2-11"; "2-9" already present
    const next = applyRuleToState(base, "m2", { weekday: 2, startHour: 10, endHour: 12 }, 0);
    expect(next.m2).toEqual(["2-9", "2-10", "2-11"]);
  });

  it("does not duplicate slots already present", () => {
    const next = applyRuleToState(base, "m1", { weekday: 1, startHour: 9, endHour: 11 }, 0);
    expect(next.m1).toEqual(["1-9", "1-10"]);
  });

  it("creates a layer when the member has none", () => {
    const next = applyRuleToState(base, "m7", { weekday: 5, startHour: 8, endHour: 10 }, 0);
    expect(next.m7).toEqual(["5-8", "5-9"]);
  });

  it("does not mutate the input state", () => {
    applyRuleToState(base, "m1", { weekday: 1, startHour: 12, endHour: 14 }, 0);
    expect(base.m1).toEqual(["1-9", "1-10"]);
  });
});

describe("seed accessors", () => {
  it("exposes 6 seed members", () => {
    expect(getMembers()).toHaveLength(6);
  });

  it("returns availability layers per member", () => {
    const all = getAllAvailability();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((m) => Array.isArray(m.slots))).toBe(true);
  });
});
