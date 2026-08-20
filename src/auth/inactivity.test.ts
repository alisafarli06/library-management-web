import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INACTIVITY_TIMEOUT_MS,
  clearLastActivity,
  getLastActivityAt,
  isInactivityExpired,
  msUntilInactivityExpiry,
  recordActivity,
} from './inactivity';
import {
  clearSession,
  hasValidAccessSession,
  saveAuthentication,
} from './session';
import { setTokens } from './tokenStorage';

function accessToken(expOffsetSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: 'user@library.com',
    type: 'access',
    role: 'USER',
    iat: now - 30,
    exp: now + expOffsetSeconds,
  };
  const encoded = window
    .btoa(JSON.stringify(payload))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  return `eyJhbGciOiJub25lIn0.${encoded}.sig`;
}

describe('inactivity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    clearSession();
  });

  afterEach(() => {
    clearSession();
    vi.useRealTimers();
  });

  it('records activity and treats a fresh timestamp as not expired', () => {
    expect(getLastActivityAt()).toBeNull();
    expect(isInactivityExpired()).toBe(true);

    recordActivity();
    expect(getLastActivityAt()).toBe(Date.now());
    expect(isInactivityExpired()).toBe(false);
    expect(msUntilInactivityExpiry()).toBe(INACTIVITY_TIMEOUT_MS);
  });

  it('activity resets the inactivity window', () => {
    recordActivity();
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 60_000);
    expect(isInactivityExpired()).toBe(false);

    recordActivity();
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 60_000);
    expect(isInactivityExpired()).toBe(false);
    expect(msUntilInactivityExpiry()).toBe(60_000);

    vi.advanceTimersByTime(60_000);
    expect(isInactivityExpired()).toBe(true);
  });

  it('expires after 30 minutes without activity', () => {
    recordActivity();
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1);
    expect(isInactivityExpired()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(isInactivityExpired()).toBe(true);
  });

  it('detects expired inactivity after browser reopen and clears the session', () => {
    saveAuthentication({ accessToken: accessToken(60 * 60), refreshToken: 'refresh-still-valid' });
    expect(hasValidAccessSession()).toBe(true);

    // Simulate closing the browser, waiting over 30 minutes, then reopening.
    const last = getLastActivityAt();
    expect(last).not.toBeNull();
    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS + 1_000);

    expect(isInactivityExpired()).toBe(true);
    expect(hasValidAccessSession()).toBe(false);
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
    expect(window.localStorage.getItem('library.refreshToken')).toBeNull();
    expect(getLastActivityAt()).toBeNull();
  });

  it('keeps an active session valid and does not treat JWT refresh as activity', () => {
    saveAuthentication({ accessToken: accessToken(60), refreshToken: 'refresh' });
    const activityAtLogin = getLastActivityAt();
    expect(hasValidAccessSession()).toBe(true);

    vi.advanceTimersByTime(10 * 60 * 1000);

    // Silent token refresh (http.ts uses setTokens, not saveAuthentication).
    setTokens(accessToken(15 * 60), 'refresh-rotated');
    expect(getLastActivityAt()).toBe(activityAtLogin);
    expect(hasValidAccessSession()).toBe(true);

    // User activity extends the idle window; JWT refresh alone must not.
    recordActivity();
    const afterActivity = getLastActivityAt();
    expect(afterActivity).toBeGreaterThan(activityAtLogin!);

    vi.advanceTimersByTime(20 * 60 * 1000);
    expect(isInactivityExpired()).toBe(false);
    expect(hasValidAccessSession()).toBe(true);
  });

  it('clearSession removes the last-activity stamp', () => {
    recordActivity();
    clearLastActivity();
    expect(getLastActivityAt()).toBeNull();

    saveAuthentication({ accessToken: accessToken(60), refreshToken: 'refresh' });
    clearSession();
    expect(getLastActivityAt()).toBeNull();
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
  });
});
