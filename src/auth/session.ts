import type { AuthenticationResponse } from '../types/api';
import type { Role } from '../types/enums';
import { setAuthNotice } from './authNotice';
import { clearLastActivity, INACTIVITY_MESSAGE, isInactivityExpired, recordActivity } from './inactivity';
import { getTokenEmail, getTokenExpiration, getTokenRole, isTokenExpired } from './jwt';
import {
  clearTokens,
  getAccessToken as readAccessToken,
  getRefreshToken as readRefreshToken,
  setTokens,
} from './tokenStorage';

export function getAccessToken(): string | null {
  return readAccessToken();
}

export function getRefreshToken(): string | null {
  return readRefreshToken();
}

export function getCurrentRole(): Role | null {
  const token = readAccessToken();
  return token ? getTokenRole(token) : null;
}

export function getCurrentEmail(): string | null {
  const token = readAccessToken();
  return token ? getTokenEmail(token) : null;
}

export function isAccessTokenExpired(): boolean {
  const token = readAccessToken();
  if (!token) {
    return true;
  }
  return isTokenExpired(token);
}

export function hasValidAccessSession(): boolean {
  const token = readAccessToken();
  if (!token) {
    return false;
  }
  const hasClaims = getTokenEmail(token) !== null && getTokenRole(token) !== null;
  if (!hasClaims) {
    return false;
  }
  // Inactivity is independent of JWT expiry; expired idle sessions cannot be
  // revived by a still-valid refresh token after browser reopen.
  if (isInactivityExpired()) {
    clearTokens();
    clearLastActivity();
    setAuthNotice(INACTIVITY_MESSAGE);
    return false;
  }
  if (!isTokenExpired(token)) {
    return true;
  }
  return Boolean(readRefreshToken());
}

export function getAccessTokenExpiresAt(): Date | null {
  const token = readAccessToken();
  if (!token) {
    return null;
  }
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return null;
  }
  return new Date(exp * 1000);
}

export function saveAuthentication(response: AuthenticationResponse): void {
  setTokens(response.accessToken, response.refreshToken);
  recordActivity();
}

export function clearSession(): void {
  clearTokens();
  clearLastActivity();
}
