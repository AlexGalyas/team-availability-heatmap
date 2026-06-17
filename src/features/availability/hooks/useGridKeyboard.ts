// Keyboard navigation for the availability grid (WAI-ARIA grid pattern).
//
// Roving tabindex: exactly one cell is in the tab order at a time (`active`), so Tab
// enters/leaves the grid as a single stop and Arrow keys move within it. Home/End jump to
// the row's first/last weekday. Shift+Arrow range-paints: the destination cell is toggled
// to match the cell we left, mirroring the mouse drag-paint (T6). Enter/Space toggling is
// handled natively by the cell button (keyboard click → `detail === 0`, see GridCell).

import { type KeyboardEvent, useCallback, useState } from "react";
import { cellDomId, HOURS, WEEKDAYS } from "../lib/geometry";
import type { LocalCell, Weekday } from "../model/types";

export interface UseGridKeyboardParams {
  disabled: boolean;
  /** Effective selected state of a cell (drives Shift+Arrow paint direction). */
  isSelected: (weekday: Weekday, hour: number) => boolean;
  onToggle: (weekday: Weekday, hour: number) => void;
}

export interface GridKeyboard {
  /** The cell currently in the tab order / focused on navigation. */
  active: LocalCell;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}

export function useGridKeyboard({
  disabled,
  isSelected,
  onToggle,
}: UseGridKeyboardParams): GridKeyboard {
  const [active, setActive] = useState<LocalCell>({
    weekday: WEEKDAYS[0],
    hour: HOURS[0],
  });

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const wIdx = WEEKDAYS.indexOf(active.weekday);
      const hIdx = HOURS.indexOf(active.hour);
      let nw = wIdx;
      let nh = hIdx;

      switch (e.key) {
        case "ArrowRight":
          nw = Math.min(wIdx + 1, WEEKDAYS.length - 1);
          break;
        case "ArrowLeft":
          nw = Math.max(wIdx - 1, 0);
          break;
        case "ArrowDown":
          nh = Math.min(hIdx + 1, HOURS.length - 1);
          break;
        case "ArrowUp":
          nh = Math.max(hIdx - 1, 0);
          break;
        case "Home":
          nw = 0;
          break;
        case "End":
          nw = WEEKDAYS.length - 1;
          break;
        default:
          return; // not a navigation key — leave it to the focused cell
      }

      e.preventDefault();
      const next: LocalCell = { weekday: WEEKDAYS[nw], hour: HOURS[nh] };

      // Shift+Arrow extends a painted run: make the destination match where we came from.
      if (
        e.shiftKey &&
        !disabled &&
        isSelected(active.weekday, active.hour) !==
          isSelected(next.weekday, next.hour)
      ) {
        onToggle(next.weekday, next.hour);
      }

      setActive(next);
      document.getElementById(cellDomId(next.weekday, next.hour))?.focus();
    },
    [active, disabled, isSelected, onToggle],
  );

  return { active, onKeyDown };
}
