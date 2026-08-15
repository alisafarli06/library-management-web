import { afterEach, describe, expect, it } from 'vitest';
import { clearSession, hasValidAccessSession, saveAuthentication } from './session';

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

describe('session', () => {
  afterEach(() => {
    clearSession();
  });

  it('treats a live access token as a valid session', () => {
    saveAuthentication({ accessToken: accessToken(60), refreshToken: 'refresh' });
    expect(hasValidAccessSession()).toBe(true);
  });

  it('keeps the session when the access token is expired but a refresh token remains', () => {
    saveAuthentication({ accessToken: accessToken(-10), refreshToken: 'refresh' });
    expect(hasValidAccessSession()).toBe(true);
  });

  it('rejects an expired access token when there is no refresh token', () => {
    saveAuthentication({ accessToken: accessToken(-10), refreshToken: 'refresh' });
    window.localStorage.removeItem('library.refreshToken');
    expect(hasValidAccessSession()).toBe(false);
  });
});
