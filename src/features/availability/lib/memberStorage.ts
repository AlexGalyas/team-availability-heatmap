// Persistence of the "who am I" identity in localStorage. Pure side-effect helpers,
// kept out of components per the no-business-logic-in-components rule. All access is
// guarded: localStorage is absent under SSR and can throw (private mode, quota), and
// identity is non-critical, so failures degrade silently to "no stored member".

const STORAGE_KEY = "team-availability:current-member";

/** The persisted member id, or `null` if none / storage is unavailable. */
export function readStoredMemberId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist (or clear, when `null`) the current member id. Never throws. */
export function writeStoredMemberId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id === null) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  } catch {
    // Ignore — identity persistence is best-effort.
  }
}
