import { fireEvent, render, screen } from "@testing-library/react";
import { type Mock, describe, expect, it, vi } from "vitest";
import { cellDomId, localCellKey } from "../lib/geometry";
import type { Weekday } from "../model/types";
import type { Heatmap } from "../hooks/useHeatmap";
import type { DragSelection } from "../hooks/useDragSelection";
import { AvailabilityGrid } from "./AvailabilityGrid";

const heatmap: Heatmap = {
  counts: new Map(),
  max: 3,
  countFor: () => 0,
  intensityFor: () => 0,
};

function renderGrid(opts: { selected?: Set<string>; disabled?: boolean } = {}) {
  const selected = opts.selected ?? new Set<string>();
  const onToggle = vi.fn();
  const drag: DragSelection = {
    isDragging: false,
    start: vi.fn(),
    extend: vi.fn(),
    isSelected: (w, h) => selected.has(localCellKey(w, h)),
    isInRange: () => false,
  };
  render(
    <AvailabilityGrid
      heatmap={heatmap}
      drag={drag}
      disabled={opts.disabled ?? false}
      onToggle={onToggle}
    />,
  );
  return { onToggle };
}

const grid = () => screen.getByRole("grid");
const cell = (weekday: number, hour: number): HTMLElement => {
  const el = document.getElementById(cellDomId(weekday as Weekday, hour));
  if (!el) throw new Error(`no cell ${weekday}-${hour}`);
  return el;
};

describe("AvailabilityGrid keyboard navigation", () => {
  it("exposes a single tab stop (roving tabindex) on the first cell", () => {
    renderGrid();
    expect(cell(1, 8)).toHaveAttribute("tabindex", "0");
    expect(cell(2, 8)).toHaveAttribute("tabindex", "-1");
    expect(cell(1, 9)).toHaveAttribute("tabindex", "-1");
  });

  it("moves the active cell and focus with arrow keys", () => {
    renderGrid();
    fireEvent.keyDown(grid(), { key: "ArrowRight" });
    fireEvent.keyDown(grid(), { key: "ArrowDown" });

    expect(cell(2, 9)).toHaveFocus();
    expect(cell(2, 9)).toHaveAttribute("tabindex", "0");
    expect(cell(1, 8)).toHaveAttribute("tabindex", "-1");
  });

  it("jumps to row edges with Home/End and clamps at the boundary", () => {
    renderGrid();
    fireEvent.keyDown(grid(), { key: "End" });
    expect(cell(5, 8)).toHaveFocus();
    fireEvent.keyDown(grid(), { key: "ArrowRight" }); // already at last column
    expect(cell(5, 8)).toHaveFocus();
    fireEvent.keyDown(grid(), { key: "Home" });
    expect(cell(1, 8)).toHaveFocus();
    fireEvent.keyDown(grid(), { key: "ArrowUp" }); // already at first row
    expect(cell(1, 8)).toHaveFocus();
  });

  it("range-paints with Shift+Arrow, matching the origin cell's state", () => {
    const { onToggle } = renderGrid({ selected: new Set([localCellKey(1, 8)]) });
    // Origin (1,8) is selected, destination (1,9) is not → toggle to match.
    fireEvent.keyDown(grid(), { key: "ArrowDown", shiftKey: true });
    expect(onToggle).toHaveBeenCalledWith(1, 9);
  });

  it("plain arrow navigation does not toggle", () => {
    const { onToggle } = renderGrid();
    fireEvent.keyDown(grid(), { key: "ArrowDown" });
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("toggles on keyboard click (detail 0) but ignores pointer clicks (detail ≥ 1)", () => {
    const { onToggle } = renderGrid();
    fireEvent.click(cell(1, 8), { detail: 0 });
    expect(onToggle).toHaveBeenCalledWith(1, 8);

    (onToggle as Mock).mockClear();
    fireEvent.click(cell(1, 8), { detail: 1 });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
