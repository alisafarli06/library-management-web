import { describe, expect, it } from 'vitest';
import { createApiErrorFromResponse } from './http';

describe('createApiErrorFromResponse', () => {
  it('parses standard API error JSON into ApiError', () => {
    const error = createApiErrorFromResponse(
      404,
      JSON.stringify({
        timestamp: '2026-08-17T00:00:00Z',
        status: 404,
        error: 'Not Found',
        message: 'Member not found for authenticated user',
      }),
    );

    expect(error.message).toBe('Member not found for authenticated user');
    expect(error.status).toBe(404);
  });

  it('parses errors without fieldErrors', () => {
    const error = createApiErrorFromResponse(
      401,
      JSON.stringify({
        timestamp: '2026-08-17T00:00:00Z',
        status: 401,
        error: 'Unauthorized',
        message: 'Token expired',
      }),
    );

    expect(error.message).toBe('Token expired');
    expect(error.fieldErrors).toBeNull();
  });

  it('never uses the raw JSON body as the message', () => {
    const raw =
      '{"timestamp":"2026-08-17T00:00:00Z","status":500,"error":"Internal Server Error","message":"Database unavailable"}';
    const malformed = '{"timestamp":"2026-08-17T00:00:00Z","status":500,"error":"Internal Server Error"}';

    expect(createApiErrorFromResponse(500, raw).message).toBe('Database unavailable');
    expect(createApiErrorFromResponse(500, malformed).message).toBe('Request failed with status 500');
    expect(createApiErrorFromResponse(500, raw).message.startsWith('{')).toBe(false);
  });
});
