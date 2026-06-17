import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { localCellKey } from "../lib/geometry";
import type { LocalCell } from "../model/types";
import {
  type DragCommit,
  type UseDragSelectionParams,
  useDragSelection,
} from "./useDragSelection";

function setup(overrides: Partial<UseDragSelectionParams> = {}) {
  const onCommit = vi.fn<(change: DragCommit) => void>();
  const params: UseDragSelectionParams = {
    selected: new Set<string>(),
    onCommit,
    disabled: false,
    ...overrides,
  };
  const view = renderHook((p: UseDragSelectionParams) => useDragSelection(p), {
    initialProps: params,
  });
  return { onCommit, ...view };
}

/** Release the pointer at the document level — the hook commits on this. */
function pointerUp() {
  act(() => {
    window.dispatchEvent(new Event("pointerup"));
  });
}

const keys = (cells: LocalCell[]) =>
  new Set(cells.map((c) => localCellKey(c.weekday, c.hour)));

describe("useDragSelection", () => {
  it("paints a rectangle and commits the spanned cells on release", () => {
    const { result, onCommit } = setup();

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => result.current.extend({ weekday: 2, hour: 9 }));
    pointerUp();

    expect(onCommit).toHaveBeenCalledTimes(1);
    const change = onCommit.mock.calls[0][0];
    expect(change.mode).toBe("paint");
    // 2 weekdays × 2 hours = 4 cells.
    expect(keys(change.cells)).toEqual(
      new Set(["1-8", "1-9", "2-8", "2-9"]),
    );
  });

  it("normalizes the rectangle regardless of drag direction", () => {
    const { result, onCommit } = setup();

    // Drag up-and-left: end cell is above/left of the start cell.
    act(() => result.current.start({ weekday: 3, hour: 11 }));
    act(() => result.current.extend({ weekday: 2, hour: 10 }));
    pointerUp();

    expect(keys(onCommit.mock.calls[0][0].cells)).toEqual(
      new Set(["2-10", "2-11", "3-10", "3-11"]),
    );
  });

  it("erases when the first cell is already selected", () => {
    const { result, onCommit } = setup({
      selected: new Set([localCellKey(1, 8)]),
    });

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => result.current.extend({ weekday: 1, hour: 9 }));
    pointerUp();

    expect(onCommit.mock.calls[0][0].mode).toBe("erase");
    expect(keys(onCommit.mock.calls[0][0].cells)).toEqual(
      new Set(["1-8", "1-9"]),
    );
  });

  it("flags only in-range cells while dragging and clears them on release", () => {
    const { result } = setup();

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => result.current.extend({ weekday: 1, hour: 9 }));

    expect(result.current.isDragging).toBe(true);
    expect(result.current.isInRange(1, 8)).toBe(true);
    expect(result.current.isInRange(1, 9)).toBe(true);
    expect(result.current.isInRange(2, 8)).toBe(false);

    pointerUp();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.isInRange(1, 8)).toBe(false);
  });

  it("previews the resulting selected state per mode", () => {
    const { result } = setup({ selected: new Set([localCellKey(5, 19)]) });

    // Paint drag: in-range cells preview as selected; committed cells outside stay selected.
    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => result.current.extend({ weekday: 1, hour: 9 }));
    expect(result.current.isSelected(1, 8)).toBe(true);
    expect(result.current.isSelected(5, 19)).toBe(true); // untouched committed cell
    expect(result.current.isSelected(2, 8)).toBe(false);
  });

  it("erase preview hides the marker on in-range selected cells", () => {
    const { result } = setup({
      selected: new Set([localCellKey(1, 8), localCellKey(1, 9)]),
    });

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => result.current.extend({ weekday: 1, hour: 9 }));
    expect(result.current.isSelected(1, 8)).toBe(false);
    expect(result.current.isSelected(1, 9)).toBe(false);
  });

  it("is inert when disabled", () => {
    const { result, onCommit } = setup({ disabled: true });

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    expect(result.current.isDragging).toBe(false);
    pointerUp();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("aborts without committing on pointer-cancel", () => {
    const { result, onCommit } = setup();

    act(() => result.current.start({ weekday: 1, hour: 8 }));
    act(() => {
      window.dispatchEvent(new Event("pointercancel"));
    });

    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });
});
