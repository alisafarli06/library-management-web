import { describe, expect, it } from 'vitest';
import { resolveDevApiProxyTarget } from './devApiProxyTarget';

describe('resolveDevApiProxyTarget', () => {
  it('uses localhost when VITE_API_ORIGIN is unset', () => {
    expect(resolveDevApiProxyTarget(undefined)).toBe('http://localhost:8080');
    expect(resolveDevApiProxyTarget('')).toBe('http://localhost:8080');
  });

  it('keeps an explicit local API origin', () => {
    expect(resolveDevApiProxyTarget('http://localhost:8080')).toBe('http://localhost:8080');
    expect(resolveDevApiProxyTarget('http://127.0.0.1:8080/')).toBe('http://127.0.0.1:8080');
  });

  it('does not proxy npm run dev to the production Render API', () => {
    expect(resolveDevApiProxyTarget('https://library-management-api-8wiv.onrender.com')).toBe(
      'http://localhost:8080',
    );
  });
});
