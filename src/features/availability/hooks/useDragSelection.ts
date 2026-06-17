// Drag-to-paint selection over the availability grid.
//
// The gesture paints a rectangle between the cell where the pointer went down (`start`)
// and the cell currently under it (`current`). The MODE is fixed by the first cell: if
// it was already selected we ERASE, otherwise we PAINT. While dragging, `isSelected`
// returns the *previewed* state and `isInRange` flags cells inside the rectangle. On
// pointer-up the change is committed once (mode + affected cells); pointer-cancel aborts.
//
// Drag state is intentionally LOCAL (not Redux): it churns on every cell the pointer
// crosses, and `memo`'d cells only re-render when their own preview flags flip.

import { useCallback, useEffect, useRef, useState } from "react";
import { HOURS, localCellKey, WEEKDAYS } from "../lib/geometry";
import type { LocalCell, Weekday } from "../model/types";

export type DragMode = "paint" | "erase";

interface DragState {
  start: LocalCell;
  current: LocalCell;
  mode: DragMode;
}

/** The committed change handed to the caller on pointer-up. */
export interface DragCommit {
  mode: DragMode;
  /** Every grid cell inside the drag rectangle (valid weekdays/hours only). */
  cells: LocalCell[];
}

export interface UseDragSelectionParams {
  /** Local-cell keys the current member is currently free in (drives mode + preview). */
  selected: ReadonlySet<string>;
  /** Apply the gesture — wired to `putMyAvailability` (optimistic). */
  onCommit: (change: DragCommit) => void;
  /** No current member → drags are inert. */
  disabled: boolean;
}

export interface DragSelection {
  isDragging: boolean;
  /** Begin a drag at `cell`; mode is derived from whether the cell is already selected. */
  start: (cell: LocalCell) => void;
  /** Extend the drag rectangle to `cell` (pointer moved over it). No-op when idle. */
  extend: (cell: LocalCell) => void;
  /** Effective selected state: previewed during a drag, committed value otherwise. */
  isSelected: (weekday: Weekday, hour: number) => boolean;
  /** Is the cell inside the active drag rectangle? Always false when idle. */
  isInRange: (weekday: Weekday, hour: number) => boolean;
}

/** Is `(weekday, hour)` inside the rectangle spanned by cells `a` and `b`? */
function inRect(a: LocalCell, b: LocalCell, weekday: number, hour: number): boolean {
  const wMin = Math.min(a.weekday, b.weekday);
  const wMax = Math.max(a.weekday, b.weekday);
  const hMin = Math.min(a.hour, b.hour);
  const hMax = Math.max(a.hour, b.hour);
  return weekday >= wMin && weekday <= wMax && hour >= hMin && hour <= hMax;
}

/** Enumerate the valid grid cells inside the drag rectangle, row-major. */
function rectCells(a: LocalCell, b: LocalCell): LocalCell[] {
  const cells: LocalCell[] = [];
  for (const weekday of WEEKDAYS) {
    for (const hour of HOURS) {
      if (inRect(a, b, weekday, hour)) cells.push({ weekday, hour });
    }
  }
  return cells;
}

export function useDragSelection({
  selected,
  onCommit,
  disabled,
}: UseDragSelectionParams): DragSelection {
  const [drag, setDrag] = useState<DragState | null>(null);

  // Latest values for the window-level pointer-up handler, so it never goes stale and we
  // don't have to re-subscribe on every `extend`.
  const dragRef = useRef<DragState | null>(drag);
  const selectedRef = useRef(selected);
  const onCommitRef = useRef(onCommit);
  dragRef.current = drag;
  selectedRef.current = selected;
  onCommitRef.current = onCommit;

  const start = useCallback(
    (cell: LocalCell) => {
      if (disabled) return;
      const mode: DragMode = selectedRef.current.has(
        localCellKey(cell.weekday, cell.hour),
      )
        ? "erase"
        : "paint";
      setDrag({ start: cell, current: cell, mode });
    },
    [disabled],
  );

  const extend = useCallback((cell: LocalCell) => {
    setDrag((d) => (d ? { ...d, current: cell } : d));
  }, []);

  const isDragging = drag !== null;

  // Commit on release anywhere in the document; abort on cancel. Active only mid-drag.
  useEffect(() => {
    if (!isDragging) return;
    const finish = (commit: boolean) => {
      const d = dragRef.current;
      if (d && commit) {
        onCommitRef.current({ mode: d.mode, cells: rectCells(d.start, d.current) });
      }
      setDrag(null);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [isDragging]);

  const isSelected = useCallback(
    (weekday: Weekday, hour: number) => {
      if (drag && inRect(drag.start, drag.current, weekday, hour)) {
        return drag.mode === "paint";
      }
      return selected.has(localCellKey(weekday, hour));
    },
    [drag, selected],
  );

  const isInRange = useCallback(
    (weekday: Weekday, hour: number) =>
      drag ? inRect(drag.start, drag.current, weekday, hour) : false,
    [drag],
  );

  return { isDragging, start, extend, isSelected, isInRange };
}
