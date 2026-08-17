import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/http';
import { errorMessage, sanitizeErrorText } from './formErrors';

describe('sanitizeErrorText', () => {
  it('returns readable ApiError messages', () => {
    expect(
      sanitizeErrorText(
        new ApiError({
          timestamp: '2026-08-17T00:00:00Z',
          status: 404,
          error: 'Not Found',
          message: 'Member not found for authenticated user',
          fieldErrors: null,
        }),
      ),
    ).toBe('Member not found for authenticated user');
  });

  it('never returns raw JSON error bodies', () => {
    const rawJson =
      '{"timestamp":"2026-08-17T00:00:00Z","status":401,"error":"Unauthorized","message":"Token expired"}';
    expect(
      sanitizeErrorText(
        new ApiError({
          timestamp: '2026-08-17T00:00:00Z',
          status: 401,
          error: 'Unauthorized',
          message: rawJson,
          fieldErrors: null,
        }),
      ),
    ).toBe('Your session has expired. Please sign in again.');
  });

  it('maps unknown statuses to a fallback', () => {
    expect(
      errorMessage(
        new ApiError({
          timestamp: '2026-08-17T00:00:00Z',
          status: 500,
          error: 'Internal Server Error',
          message: '{"unexpected":true}',
          fieldErrors: null,
        }),
        'Something went wrong.',
      ),
    ).toBe('Something went wrong. Please try again.');
  });
});
