import type { AuthenticationResponse } from '../types/api';
import type { Role } from '../types/enums';
import { getTokenEmail, getTokenRole, isTokenExpired } from './jwt';
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
  if (!token || isTokenExpired(token)) {
    return false;
  }
  return getTokenEmail(token) !== null && getTokenRole(token) !== null;
}

export function saveAuthentication(response: AuthenticationResponse): void {
  setTokens(response.accessToken, response.refreshToken);
}

export function clearSession(): void {
  clearTokens();
}
