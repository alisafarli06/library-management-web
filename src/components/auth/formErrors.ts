import { ApiError } from '../../api/http';
import { SESSION_EXPIRED_MESSAGE } from '../../api/sessionExpiry';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

function looksLikeJsonObject(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('{') && trimmed.endsWith('}');
}

function extractMessageFromJson(value: string): string | null {
  if (!looksLikeJsonObject(value)) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as { message?: unknown };
    if (typeof parsed.message === 'string' && parsed.message.trim().length > 0) {
      return parsed.message.trim();
    }
  } catch {
    return null;
  }
  return null;
}

function friendlyStatusMessage(status: number, fallback: string): string {
  switch (status) {
    case 400:
      return 'The request could not be processed. Check your input and try again.';
    case 401:
      return SESSION_EXPIRED_MESSAGE;
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested item could not be found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 500:
      return `${fallback} Please try again.`;
    default:
      return fallback;
  }
}

export function sanitizeErrorText(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) {
    const rawMessage = error.message.trim();
    const parsedFromJson = extractMessageFromJson(rawMessage);
    const message = parsedFromJson ?? rawMessage;

    if (message.length > 0 && !looksLikeJsonObject(message)) {
      if (error.status === 401) {
        return SESSION_EXPIRED_MESSAGE;
      }
      return message;
    }

    return friendlyStatusMessage(error.status, fallback);
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    const parsedFromJson = extractMessageFromJson(error.message);
    if (parsedFromJson) {
      return parsedFromJson;
    }
    if (!looksLikeJsonObject(error.message)) {
      return error.message.trim();
    }
  }

  return fallback;
}

export function errorMessage(error: unknown, fallback: string): string {
  return sanitizeErrorText(error, fallback);
}

export function fieldErrorsFrom(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.fieldErrors) {
    return error.fieldErrors;
  }
  return {};
}
