// Identity picker — "Я — …". Presentational: the parent owns persistence (useCurrentMember)
// and passes the value + setter down, keeping this component logic-free.

import type { Member } from "../model/types";
import styles from "./memberSwitcher.module.scss";

export interface MemberSwitcherProps {
  members: Member[];
  currentMemberId: string | null;
  onSelect: (id: string | null) => void;
}

const SELECT_ID = "member-switcher";

export function MemberSwitcher({
  members,
  currentMemberId,
  onSelect,
}: MemberSwitcherProps) {
  return (
    <div className={styles.switcher}>
      <label htmlFor={SELECT_ID} className={styles.label}>
        Я —
      </label>
      <select
        id={SELECT_ID}
        className={styles.select}
        value={currentMemberId ?? ""}
        onChange={(e) => onSelect(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Оберіть учасника…</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </div>
  );
}
