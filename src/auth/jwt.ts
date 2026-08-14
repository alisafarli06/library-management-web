import type { JwtPayload } from '../types/api';
import type { Role } from '../types/enums';

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  const binary = window.atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function isRole(value: unknown): value is Role {
  return value === 'USER' || value === 'ADMIN';
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === 'string' &&
    (payload.type === 'access' || payload.type === 'refresh') &&
    isRole(payload.role) &&
    typeof payload.iat === 'number' &&
    typeof payload.exp === 'number'
  );
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const json = decodeBase64Url(parts[1]);
    const parsed: unknown = JSON.parse(json);
    return isJwtPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getTokenEmail(token: string): string | null {
  return decodeJwtPayload(token)?.sub ?? null;
}

export function getTokenRole(token: string): Role | null {
  return decodeJwtPayload(token)?.role ?? null;
}

export function getTokenExpiration(token: string): number | null {
  return decodeJwtPayload(token)?.exp ?? null;
}

export function isTokenExpired(token: string, nowMs: number = Date.now()): boolean {
  const exp = getTokenExpiration(token);
  if (exp === null) {
    return true;
  }
  return exp * 1000 <= nowMs;
}
