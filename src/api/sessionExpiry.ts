import { setAuthNotice } from '../auth/authNotice';
import { clearSession } from '../auth/session';

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.';

type SessionExpiredHandler = (message: string) => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;
let handlingSessionExpiry = false;

export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

export function resetSessionExpiryHandling(): void {
  handlingSessionExpiry = false;
}

export function handleSessionExpired(message = SESSION_EXPIRED_MESSAGE): void {
  if (handlingSessionExpiry) {
    return;
  }
  handlingSessionExpiry = true;
  clearSession();
  setAuthNotice(message);
  if (sessionExpiredHandler) {
    sessionExpiredHandler(message);
    return;
  }
  window.location.assign('/login');
}
