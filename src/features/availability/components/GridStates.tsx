// The non-success states for the availability grid: loading / empty / error.

import { HOURS, WEEKDAYS } from "../lib/geometry";
import styles from "./grid.module.scss";

export function GridSkeleton() {
  const cells = WEEKDAYS.length * HOURS.length;
  return (
    <div
      className={styles.skeleton}
      role="status"
      aria-busy="true"
      aria-label="Завантаження сітки доступності"
    >
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} className={styles.skeletonCell} />
      ))}
    </div>
  );
}

export function GridEmpty() {
  return (
    <div className={styles.empty}>
      Ще немає даних про доступність. Оберіть учасника й позначте свої вільні
      години на сітці.
    </div>
  );
}

export interface GridErrorProps {
  onRetry: () => void;
}

export function GridError({ onRetry }: GridErrorProps) {
  return (
    <div className={styles.error} role="alert">
      <p>Не вдалося завантажити доступність.</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Повторити
      </button>
    </div>
  );
}
