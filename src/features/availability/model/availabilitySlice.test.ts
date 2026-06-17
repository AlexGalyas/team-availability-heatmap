import { describe, expect, it } from "vitest";
import {
  availabilityReducer,
  selectCurrentMemberId,
  setCurrentMember,
} from "./availabilitySlice";
import type { RootState } from "@/app/store";

describe("availabilitySlice", () => {
  it("starts with no current member", () => {
    const state = availabilityReducer(undefined, { type: "@@INIT" });
    expect(state.currentMemberId).toBeNull();
  });

  it("sets the current member", () => {
    const state = availabilityReducer(undefined, setCurrentMember("m3"));
    expect(state.currentMemberId).toBe("m3");
  });

  it("clears the current member with null", () => {
    const start = availabilityReducer(undefined, setCurrentMember("m3"));
    const cleared = availabilityReducer(start, setCurrentMember(null));
    expect(cleared.currentMemberId).toBeNull();
  });

  it("selects the current member id from root state", () => {
    const root = { availabilityUi: { currentMemberId: "m2" } } as RootState;
    expect(selectCurrentMemberId(root)).toBe("m2");
  });
});
