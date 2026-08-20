import { useEffect } from 'react';
import {
  INACTIVITY_MESSAGE,
  clearLastActivity,
  getLastActivityAt,
  isInactivityExpired,
  msUntilInactivityExpiry,
  recordActivity,
} from '../../auth/inactivity';
import { getAccessToken, getRefreshToken } from '../../auth/tokenStorage';
import { handleSessionExpired } from '../../api/sessionExpiry';

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'click',
  'touchstart',
  'scroll',
  'wheel',
] as const;

const ACTIVITY_THROTTLE_MS = 1000;

function hasStoredSession(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}

function expireForInactivity(): void {
  handleSessionExpired(INACTIVITY_MESSAGE);
}

/**
 * Tracks browser activity while a session exists and logs the user out after
 * 30 minutes without interaction. JWT refresh is unchanged and still runs only
 * on API 401 Token expired responses.
 */
export function InactivityTimeoutListener() {
  useEffect(() => {
    let timeoutId: number | null = null;
    let throttleLast = 0;
    let throttleTimer: number | null = null;

    function clearExpiryTimer(): void {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    }

    function scheduleExpiry(): void {
      clearExpiryTimer();
      if (!hasStoredSession()) {
        return;
      }
      if (isInactivityExpired()) {
        expireForInactivity();
        return;
      }
      const delay = msUntilInactivityExpiry();
      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        if (hasStoredSession() && isInactivityExpired()) {
          expireForInactivity();
        }
      }, delay);
    }

    function onActivity(): void {
      if (!hasStoredSession()) {
        return;
      }
      recordActivity();
      scheduleExpiry();
    }

    function onActivityThrottled(): void {
      if (!hasStoredSession()) {
        return;
      }
      const now = Date.now();
      const elapsed = now - throttleLast;
      if (elapsed >= ACTIVITY_THROTTLE_MS) {
        throttleLast = now;
        onActivity();
        return;
      }
      if (throttleTimer !== null) {
        return;
      }
      throttleTimer = window.setTimeout(() => {
        throttleTimer = null;
        throttleLast = Date.now();
        onActivity();
      }, ACTIVITY_THROTTLE_MS - elapsed);
    }

    if (hasStoredSession()) {
      if (getLastActivityAt() === null) {
        // Fresh session without a stamp should not stay open forever.
        clearLastActivity();
        expireForInactivity();
      } else if (isInactivityExpired()) {
        expireForInactivity();
      } else {
        scheduleExpiry();
      }
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivityThrottled, { passive: true, capture: true });
    }

    return () => {
      clearExpiryTimer();
      if (throttleTimer !== null) {
        window.clearTimeout(throttleTimer);
      }
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivityThrottled, { capture: true });
      }
    };
  }, []);

  return null;
}
