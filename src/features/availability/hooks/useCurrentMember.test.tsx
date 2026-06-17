import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { type AppStore, makeStore } from "@/app/store";
import { selectCurrentMemberId } from "../model/availabilitySlice";
import { readStoredMemberId, writeStoredMemberId } from "../lib/memberStorage";
import type { Member } from "../model/types";
import { useCurrentMember } from "./useCurrentMember";

const members: Member[] = [
  { id: "m1", name: "Олена" },
  { id: "m2", name: "Богдан" },
  { id: "m3", name: "Ірина" },
];

function wrap(store: AppStore) {
  function StoreWrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }
  return StoreWrapper;
}

afterEach(() => {
  window.localStorage.clear();
});

describe("useCurrentMember", () => {
  it("restores a stored member id on mount", () => {
    writeStoredMemberId("m2");
    const store = makeStore();
    renderHook(() => useCurrentMember(members), { wrapper: wrap(store) });
    expect(selectCurrentMemberId(store.getState())).toBe("m2");
  });

  it("ignores a stored id that is no longer a known member", () => {
    writeStoredMemberId("ghost");
    const store = makeStore();
    const { result } = renderHook(() => useCurrentMember(members), {
      wrapper: wrap(store),
    });
    expect(result.current.currentMemberId).toBeNull();
  });

  it("does not restore until members are available to validate against", () => {
    writeStoredMemberId("m2");
    const store = makeStore();
    const { rerender, result } = renderHook(
      ({ ms }) => useCurrentMember(ms),
      { wrapper: wrap(store), initialProps: { ms: [] as Member[] } },
    );
    expect(result.current.currentMemberId).toBeNull();
    rerender({ ms: members });
    expect(selectCurrentMemberId(store.getState())).toBe("m2");
  });

  it("select switches the layer and persists it", () => {
    const store = makeStore();
    const { result } = renderHook(() => useCurrentMember(members), {
      wrapper: wrap(store),
    });

    act(() => result.current.select("m3"));
    expect(selectCurrentMemberId(store.getState())).toBe("m3");
    expect(readStoredMemberId()).toBe("m3");

    act(() => result.current.select("m1"));
    expect(selectCurrentMemberId(store.getState())).toBe("m1");
    expect(readStoredMemberId()).toBe("m1");
  });

  it("select(null) clears the layer and its persistence", () => {
    writeStoredMemberId("m2");
    const store = makeStore();
    const { result } = renderHook(() => useCurrentMember(members), {
      wrapper: wrap(store),
    });

    act(() => result.current.select(null));
    expect(result.current.currentMemberId).toBeNull();
    expect(readStoredMemberId()).toBeNull();
  });
});
