import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokenStorage';
import type { AuthenticationResponse, ErrorResponse } from '../types/api';

const API_PREFIX = '/api';
const REFRESH_PATH = '/auth/refresh';

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;

export class ApiError extends Error {
  readonly timestamp: string;
  readonly status: number;
  readonly error: string;
  readonly fieldErrors: Record<string, string> | null;

  constructor(response: ErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.timestamp = response.timestamp;
    this.status = response.status;
    this.error = response.error;
    this.fieldErrors = response.fieldErrors;
  }
}

export function buildQuery(params: object | undefined): string {
  if (!params) {
    return '';
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    appendQueryValue(search, key, value);
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

function isQueryPrimitive(value: unknown): value is QueryPrimitive {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function appendQueryValue(search: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isQueryPrimitive(item)) {
        search.append(key, String(item));
      }
    }
    return;
  }

  if (!isQueryPrimitive(value)) {
    return;
  }

  if (typeof value === 'string' && value.length === 0) {
    return;
  }

  search.append(key, String(value));
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return (
    typeof body.timestamp === 'string' &&
    typeof body.status === 'number' &&
    typeof body.error === 'string' &&
    typeof body.message === 'string' &&
    (body.fieldErrors === null ||
      (typeof body.fieldErrors === 'object' && body.fieldErrors !== null && !Array.isArray(body.fieldErrors)))
  );
}

function toApiError(status: number, rawBody: string): ApiError {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (isErrorResponse(parsed)) {
      return new ApiError(parsed);
    }
  } catch {
    // Body was not JSON; fall through with status and raw text.
  }

  return new ApiError({
    timestamp: new Date().toISOString(),
    status,
    error: 'Error',
    message: rawBody || `Request failed with status ${status}`,
    fieldErrors: null,
  });
}

type ParseAs = 'json' | 'text' | 'blob' | 'void';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: object;
  json?: unknown;
  formData?: FormData;
  parse: ParseAs;
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Token expired',
      fieldErrors: null,
    });
  }

  const response = await fetch(`${API_PREFIX}${REFRESH_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    clearTokens();
    throw toApiError(response.status, rawBody);
  }

  const parsed: unknown = rawBody ? JSON.parse(rawBody) : null;
  if (!isAuthenticationResponse(parsed)) {
    clearTokens();
    throw new ApiError({
      timestamp: new Date().toISOString(),
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
      fieldErrors: null,
    });
  }

  setTokens(parsed.accessToken, parsed.refreshToken);
}

function isAuthenticationResponse(value: unknown): value is AuthenticationResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const body = value as Record<string, unknown>;
  return typeof body.accessToken === 'string' && typeof body.refreshToken === 'string';
}

function refreshOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function parseBody(response: Response, parse: ParseAs): Promise<unknown> {
  if (parse === 'void' || response.status === 204) {
    return undefined;
  }

  if (parse === 'blob') {
    return response.blob();
  }

  if (parse === 'text') {
    return response.text();
  }

  const rawBody = await response.text();
  if (!rawBody) {
    return undefined;
  }
  return JSON.parse(rawBody) as unknown;
}

async function request<T>(options: RequestOptions, isRetry = false): Promise<T> {
  const headers = new Headers();
  let body: BodyInit | undefined;

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.json);
  } else if (options.formData) {
    body = options.formData;
  }

  if (!options.skipAuth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const url = `${API_PREFIX}${options.path}${buildQuery(options.query)}`;
  const response = await fetch(url, {
    method: options.method,
    headers,
    body,
  });

  if (!response.ok) {
    const rawBody = await response.text();
    const apiError = toApiError(response.status, rawBody);
    const canRefresh =
      !options.skipRefresh &&
      !isRetry &&
      options.path !== REFRESH_PATH &&
      response.status === 401 &&
      apiError.message === 'Token expired' &&
      Boolean(getRefreshToken());

    if (canRefresh) {
      try {
        await refreshOnce();
        return request<T>(options, true);
      } catch (refreshError) {
        clearTokens();
        throw refreshError instanceof ApiError ? refreshError : apiError;
      }
    }

    throw apiError;
  }

  return (await parseBody(response, options.parse)) as T;
}

export function getJson<T>(path: string, query?: object): Promise<T> {
  return request<T>({ method: 'GET', path, query, parse: 'json' });
}

export function postJson<T>(path: string, json?: unknown, skipAuth = false): Promise<T> {
  return request<T>({
    method: 'POST',
    path,
    json,
    parse: 'json',
    skipAuth,
    skipRefresh: skipAuth,
  });
}

export function putJson<T>(path: string, json: unknown): Promise<T> {
  return request<T>({ method: 'PUT', path, json, parse: 'json' });
}

export function patchJson<T>(path: string, json: unknown): Promise<T> {
  return request<T>({ method: 'PATCH', path, json, parse: 'json' });
}

export function deleteNoContent(path: string): Promise<void> {
  return request<void>({ method: 'DELETE', path, parse: 'void' });
}

export function deleteJson<T>(path: string): Promise<T> {
  return request<T>({ method: 'DELETE', path, parse: 'json' });
}

export function postNoContent(path: string): Promise<void> {
  return request<void>({ method: 'POST', path, parse: 'void' });
}

export function postForm<T>(path: string, formData: FormData): Promise<T> {
  return request<T>({ method: 'POST', path, formData, parse: 'json' });
}

export function getBlob(path: string): Promise<Blob> {
  return request<Blob>({ method: 'GET', path, parse: 'blob' });
}

export function getText(path: string): Promise<string> {
  return request<string>({ method: 'GET', path, parse: 'text' });
}
