const AUTH_NOTICE_KEY = 'library.auth.notice';

export function setAuthNotice(message: string): void {
  sessionStorage.setItem(AUTH_NOTICE_KEY, message);
}

export function consumeAuthNotice(): string | null {
  const message = sessionStorage.getItem(AUTH_NOTICE_KEY);
  if (message) {
    sessionStorage.removeItem(AUTH_NOTICE_KEY);
  }
  return message;
}
