// "Who am I" identity: the Redux slice is the source of truth in-session; localStorage
// mirrors it so the choice survives a reload. Restoration runs in an effect (client-only)
// to avoid a hydration mismatch — the server and first client render both see `null`,
// then the stored value is applied.

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectCurrentMemberId,
  setCurrentMember,
} from "../model/availabilitySlice";
import type { Member } from "../model/types";
import { readStoredMemberId, writeStoredMemberId } from "../lib/memberStorage";

export interface CurrentMember {
  currentMemberId: string | null;
  /** Set (or clear, with `null`) the current member; updates the slice and localStorage. */
  select: (id: string | null) => void;
}

export function useCurrentMember(members: Member[]): CurrentMember {
  const dispatch = useAppDispatch();
  const currentMemberId = useAppSelector(selectCurrentMemberId);
  const restored = useRef(false);

  // Restore once, as soon as we have members to validate the stored id against — a stale
  // id (member since removed) is ignored rather than selecting a non-existent layer.
  useEffect(() => {
    if (restored.current || members.length === 0) return;
    restored.current = true;
    const stored = readStoredMemberId();
    if (stored && members.some((m) => m.id === stored)) {
      dispatch(setCurrentMember(stored));
    }
  }, [dispatch, members]);

  const select = useCallback(
    (id: string | null) => {
      dispatch(setCurrentMember(id));
      writeStoredMemberId(id);
    },
    [dispatch],
  );

  return { currentMemberId, select };
}
