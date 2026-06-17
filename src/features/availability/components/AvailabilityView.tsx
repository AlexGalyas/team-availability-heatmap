"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { localCellKey } from "../lib/geometry";
import { getLocalOffsetHours, localCellToSlotKey, parseSlotKey, toLocalCell } from "../lib/time";
import {
  useApplyRecurringRuleMutation,
  useGetAvailabilityQuery,
  useGetMembersQuery,
  usePutMyAvailabilityMutation,
} from "../model/availabilityApi";
import type {
  Member,
  MemberAvailability,
  RecurringRule,
  SlotKey,
  Weekday,
} from "../model/types";
import { useHeatmap } from "../hooks/useHeatmap";
import { type DragCommit, useDragSelection } from "../hooks/useDragSelection";
import { useCurrentMember } from "../hooks/useCurrentMember";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { GridEmpty, GridError, GridSkeleton } from "./GridStates";
import { HeatLegend } from "./HeatLegend";
import { MemberSwitcher } from "./MemberSwitcher";
import { type RecurringStatus, RecurringRuleForm } from "./RecurringRuleForm";
import styles from "./view.module.scss";

export interface AvailabilityViewProps {
  /** Server-seeded first paint; RTK Query takes over after mount. */
  initialMembers: Member[];
  initialAvailability: MemberAvailability[];
}

export function AvailabilityView({
  initialMembers,
  initialAvailability,
}: AvailabilityViewProps) {
  const { data: membersData } = useGetMembersQuery();
  const {
    data: availabilityData,
    isLoading,
    isError,
    refetch,
  } = useGetAvailabilityQuery();
  const [putMyAvailability] = usePutMyAvailabilityMutation();
  const [
    applyRecurringRule,
    {
      isLoading: ruleIsLoading,
      isError: ruleIsError,
      isSuccess: ruleIsSuccess,
    },
  ] = useApplyRecurringRuleMutation();

  const members = membersData ?? initialMembers;
  const availability = availabilityData ?? initialAvailability;

  // Identity ("who am I") — restored from localStorage after mount, persisted on change.
  const { currentMemberId, select: selectMember } = useCurrentMember(members);

  // The local UTC offset depends on the browser; resolve it after mount so SSR and the
  // first client render agree (offset 0), then re-render with the real value.
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(getLocalOffsetHours());
  }, []);

  const heatmap = useHeatmap(availability, members.length, offset);

  const mySlots = useMemo(() => {
    const set = new Set<string>();
    if (!currentMemberId) return set;
    const mine = availability.find((m) => m.memberId === currentMemberId);
    if (!mine) return set;
    for (const key of mine.slots) {
      const cell = toLocalCell(parseSlotKey(key), offset);
      if (cell) set.add(localCellKey(cell.weekday, cell.hour));
    }
    return set;
  }, [availability, currentMemberId, offset]);

  const onToggle = useCallback(
    (weekday: Weekday, hour: number) => {
      if (!currentMemberId) return;
      const key = localCellToSlotKey(weekday, hour, offset);
      const current =
        availability.find((m) => m.memberId === currentMemberId)?.slots ?? [];
      const nextSlots = current.includes(key)
        ? current.filter((s) => s !== key)
        : [...current, key];
      void putMyAvailability({ memberId: currentMemberId, slots: nextSlots });
    },
    [availability, currentMemberId, offset, putMyAvailability],
  );

  // Apply a drag gesture as a diff over the member's FULL stored UTC slots, so slots that
  // fall off the visible grid at the current offset (Sat/Sun, out-of-window) are preserved.
  const onDragCommit = useCallback(
    ({ mode, cells }: DragCommit) => {
      if (!currentMemberId) return;
      const current =
        availability.find((m) => m.memberId === currentMemberId)?.slots ?? [];
      const next = new Set<SlotKey>(current);
      for (const cell of cells) {
        const key = localCellToSlotKey(cell.weekday, cell.hour, offset);
        if (mode === "paint") next.add(key);
        else next.delete(key);
      }
      void putMyAvailability({ memberId: currentMemberId, slots: [...next] });
    },
    [availability, currentMemberId, offset, putMyAvailability],
  );

  const drag = useDragSelection({
    selected: mySlots,
    onCommit: onDragCommit,
    disabled: !currentMemberId,
  });

  // The rule is expressed in LOCAL coordinates; the server expands it to UTC using the
  // client offset (T3 contract), so send `offset` alongside the member id.
  const onApplyRule = useCallback(
    (rule: RecurringRule) => {
      if (!currentMemberId) return;
      void applyRecurringRule({ memberId: currentMemberId, rule, offsetHours: offset });
    },
    [applyRecurringRule, currentMemberId, offset],
  );

  const ruleStatus: RecurringStatus = ruleIsLoading
    ? "pending"
    : ruleIsError
      ? "error"
      : ruleIsSuccess
        ? "success"
        : "idle";

  function renderGrid() {
    if (isError && !availabilityData) {
      return <GridError onRetry={() => void refetch()} />;
    }
    if (isLoading && !availabilityData) {
      return <GridSkeleton />;
    }
    if (members.length === 0 || availability.length === 0) {
      return <GridEmpty />;
    }
    return (
      <AvailabilityGrid
        heatmap={heatmap}
        drag={drag}
        disabled={!currentMemberId}
        onToggle={onToggle}
      />
    );
  }

  const showGrid = !(isError && !availabilityData) && !(isLoading && !availabilityData);

  return (
    <main className={styles.view}>
      <h1 className={styles.title}>Доступність команди</h1>
      <div className={styles.body}>
        <div className={styles.main}>
          {showGrid && members.length > 0 && availability.length > 0 ? (
            <HeatLegend max={members.length} />
          ) : null}
          {renderGrid()}
        </div>
        {showGrid && members.length > 0 ? (
          <aside className={styles.sidebar}>
            <MemberSwitcher
              members={members}
              currentMemberId={currentMemberId}
              onSelect={selectMember}
            />
            {currentMemberId ? (
              <RecurringRuleForm onApply={onApplyRule} status={ruleStatus} />
            ) : (
              <p className={styles.hint}>
                Оберіть себе зі списку, щоб малювати свої вільні години на сітці.
              </p>
            )}
          </aside>
        ) : null}
      </div>
    </main>
  );
}
