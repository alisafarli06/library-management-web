import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InactivityTimeoutListener } from './InactivityTimeoutListener';
import {
  resetSessionExpiryHandling,
  setSessionExpiredHandler,
} from '../../api/sessionExpiry';
import { INACTIVITY_TIMEOUT_MS, getLastActivityAt, recordActivity } from '../../auth/inactivity';
import { clearSession, saveAuthentication } from '../../auth/session';

function accessToken(expOffsetSeconds: number, role: 'USER' | 'ADMIN' = 'USER'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: `${role.toLowerCase()}@library.com`,
    type: 'access',
    role,
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

describe('InactivityTimeoutListener', () => {
  const onExpired = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00.000Z'));
    clearSession();
    window.sessionStorage.clear();
    onExpired.mockReset();
    resetSessionExpiryHandling();
    setSessionExpiredHandler(onExpired);
  });

  afterEach(() => {
    cleanup();
    setSessionExpiredHandler(null);
    resetSessionExpiryHandling();
    clearSession();
    vi.useRealTimers();
  });

  it('logs the user out after 30 minutes without activity', () => {
    saveAuthentication({ accessToken: accessToken(60 * 60, 'ADMIN'), refreshToken: 'refresh' });
    render(<InactivityTimeoutListener />);

    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
    expect(window.localStorage.getItem('library.refreshToken')).toBeNull();
    expect(window.sessionStorage.getItem('library.auth.notice')).toContain('inactivity');
  });

  it('activity resets the inactivity timer', () => {
    saveAuthentication({ accessToken: accessToken(60 * 60), refreshToken: 'refresh' });
    render(<InactivityTimeoutListener />);

    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 60_000);
    window.dispatchEvent(new Event('keydown'));
    expect(getLastActivityAt()).toBe(Date.now());
    expect(onExpired).not.toHaveBeenCalled();

    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 60_000);
    expect(window.localStorage.getItem('library.accessToken')).not.toBeNull();
    expect(onExpired).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60_000);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
  });

  it('expires immediately on mount when stored inactivity has already elapsed', () => {
    saveAuthentication({ accessToken: accessToken(60 * 60), refreshToken: 'refresh' });
    recordActivity(Date.now() - INACTIVITY_TIMEOUT_MS - 1);

    render(<InactivityTimeoutListener />);

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
    expect(window.sessionStorage.getItem('library.auth.notice')).toContain('inactivity');
  });

  it('covers USER sessions the same way as ADMIN', () => {
    saveAuthentication({ accessToken: accessToken(60 * 60, 'USER'), refreshToken: 'refresh' });
    render(<InactivityTimeoutListener />);

    vi.advanceTimersByTime(INACTIVITY_TIMEOUT_MS);

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem('library.accessToken')).toBeNull();
  });
});
