const LAST_ACTIVITY_KEY = 'library.lastActivityAt';

/** 30 minutes — independent of JWT access (15m) and refresh (7d) lifetimes. */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export const INACTIVITY_MESSAGE = 'You were signed out due to inactivity. Please sign in again.';

export function getLastActivityAt(): number | null {
  const raw = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  if (raw === null || raw === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function recordActivity(nowMs: number = Date.now()): void {
  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(nowMs));
}

export function clearLastActivity(): void {
  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
}

/**
 * True when there is no recorded activity timestamp, or the elapsed time since
 * last activity is at least {@link INACTIVITY_TIMEOUT_MS}.
 */
export function isInactivityExpired(nowMs: number = Date.now()): boolean {
  const last = getLastActivityAt();
  if (last === null) {
    return true;
  }
  return nowMs - last >= INACTIVITY_TIMEOUT_MS;
}

export function msUntilInactivityExpiry(nowMs: number = Date.now()): number {
  const last = getLastActivityAt();
  if (last === null) {
    return 0;
  }
  return Math.max(0, last + INACTIVITY_TIMEOUT_MS - nowMs);
}
