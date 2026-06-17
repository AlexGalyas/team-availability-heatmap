import { type CSSProperties, type PointerEvent, memo } from "react";
import { cellDomId, formatHour, WEEKDAY_FULL_LABELS } from "../lib/geometry";
import type { Weekday } from "../model/types";
import styles from "./grid.module.scss";

export interface GridCellProps {
  weekday: Weekday;
  hour: number;
  /** Number of free members in this cell. */
  count: number;
  /** Team size (label denominator). */
  max: number;
  /** Heat intensity in [0, 1]. */
  intensity: number;
  /** Effective "my slot" state — previewed during a drag, committed otherwise. */
  isMine: boolean;
  /** Inside the active drag rectangle → show a preview outline. */
  inRange: boolean;
  /** The roving-tabindex active cell → the grid's single tab stop. */
  active: boolean;
  /** No current member selected → painting is disabled. */
  disabled: boolean;
  /** Keyboard fallback (Enter/Space). Pointer interactions go through the paint handlers. */
  onToggle: (weekday: Weekday, hour: number) => void;
  /** Pointer-down on this cell starts a drag. */
  onPaintStart: (weekday: Weekday, hour: number) => void;
  /** Pointer entered this cell while dragging → extend the rectangle. */
  onPaintEnter: (weekday: Weekday, hour: number) => void;
}

function GridCellImpl({
  weekday,
  hour,
  count,
  max,
  intensity,
  isMine,
  inRange,
  active,
  disabled,
  onToggle,
  onPaintStart,
  onPaintEnter,
}: GridCellProps) {
  const label = `${WEEKDAY_FULL_LABELS[weekday]} ${formatHour(hour)}, вільні ${count} з ${max}, ви: ${
    isMine ? "вільні" : "невільні"
  }`;

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    // Touch sets implicit pointer capture on the target, which would stop `pointerenter`
    // firing on sibling cells. Release it so the drag can cross cells.
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onPaintStart(weekday, hour);
  }

  const className = [
    styles.cellButton,
    isMine ? styles.cellButtonMine : "",
    inRange ? styles.cellButtonPreview : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="gridcell" className={styles.cell}>
      <button
        type="button"
        id={cellDomId(weekday, hour)}
        aria-label={label}
        aria-pressed={isMine}
        // Roving tabindex: only the active cell is a tab stop; arrows move within the grid.
        tabIndex={active ? 0 : -1}
        disabled={disabled}
        className={className}
        style={{ "--heat-alpha": intensity } as CSSProperties}
        onPointerDown={handlePointerDown}
        onPointerEnter={() => onPaintEnter(weekday, hour)}
        // Keyboard activation fires a click with `detail === 0`; pointer-driven clicks
        // (detail ≥ 1) are already handled by the drag's pointer-up, so ignore them.
        onClick={(e) => {
          if (e.detail === 0) onToggle(weekday, hour);
        }}
      />
    </div>
  );
}

export const GridCell = memo(GridCellImpl);
