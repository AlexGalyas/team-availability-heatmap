import { useCallback } from "react";
import {
  formatHour,
  HOURS,
  localCellKey,
  WEEKDAY_FULL_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "../lib/geometry";
import type { Weekday } from "../model/types";
import type { Heatmap } from "../hooks/useHeatmap";
import type { DragSelection } from "../hooks/useDragSelection";
import { useGridKeyboard } from "../hooks/useGridKeyboard";
import { GridCell } from "./GridCell";
import styles from "./grid.module.scss";

export interface AvailabilityGridProps {
  heatmap: Heatmap;
  /** Drag-paint selection; also the source of each cell's effective "mine"/preview state. */
  drag: DragSelection;
  /** No current member → cells are read-only. */
  disabled: boolean;
  /** Keyboard fallback toggle for a single cell. */
  onToggle: (weekday: Weekday, hour: number) => void;
}

export function AvailabilityGrid({
  heatmap,
  drag,
  disabled,
  onToggle,
}: AvailabilityGridProps) {
  // Destructure the stable methods so the adapters below keep a constant identity and
  // memo'd cells don't re-render on every drag move.
  const { start, extend } = drag;
  const onPaintStart = useCallback(
    (weekday: Weekday, hour: number) => start({ weekday, hour }),
    [start],
  );
  const onPaintEnter = useCallback(
    (weekday: Weekday, hour: number) => extend({ weekday, hour }),
    [extend],
  );

  const { active, onKeyDown } = useGridKeyboard({
    disabled,
    isSelected: drag.isSelected,
    onToggle,
  });

  return (
    <div
      role="grid"
      aria-label="Сітка доступності команди (Пн–Пт, 08:00–20:00)"
      className={styles.grid}
      onKeyDown={onKeyDown}
    >
      <div role="row" className={styles.row}>
        <span role="columnheader" className={styles.corner}>
          Час
        </span>
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            role="columnheader"
            className={styles.columnHeader}
            title={WEEKDAY_FULL_LABELS[weekday]}
          >
            {WEEKDAY_LABELS[weekday]}
          </span>
        ))}
      </div>

      {HOURS.map((hour) => (
        <div role="row" className={styles.row} key={hour}>
          <span role="rowheader" className={styles.rowHeader}>
            {formatHour(hour)}
          </span>
          {WEEKDAYS.map((weekday) => (
            <GridCell
              key={localCellKey(weekday, hour)}
              weekday={weekday}
              hour={hour}
              count={heatmap.countFor(weekday, hour)}
              max={heatmap.max}
              intensity={heatmap.intensityFor(weekday, hour)}
              isMine={drag.isSelected(weekday, hour)}
              inRange={drag.isInRange(weekday, hour)}
              active={active.weekday === weekday && active.hour === hour}
              disabled={disabled}
              onToggle={onToggle}
              onPaintStart={onPaintStart}
              onPaintEnter={onPaintEnter}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
