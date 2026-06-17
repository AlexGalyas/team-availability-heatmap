import type { CSSProperties } from "react";
import styles from "./grid.module.scss";

export interface HeatLegendProps {
  /** Team size — the top of the scale ("everyone free"). */
  max: number;
}

// Decorative scale 0…max. The per-cell counts are conveyed in each cell's aria-label,
// so the legend itself is hidden from assistive tech.
export function HeatLegend({ max }: HeatLegendProps) {
  const steps = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className={styles.legend} aria-hidden="true">
      <span>Вільних: 0</span>
      {steps.map((i) => (
        <span
          key={i}
          className={styles.swatch}
          style={{ "--heat-alpha": max === 0 ? 0 : i / max } as CSSProperties}
        />
      ))}
      <span>{max} (усі)</span>
    </div>
  );
}
