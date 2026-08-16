import { describe, expect, it } from 'vitest';
import { getGreetingName, getInitials, resolveDisplayName } from './displayName';

describe('resolveDisplayName', () => {
  it('prefers a trimmed profile name', () => {
    expect(resolveDisplayName('  E2E Admin  ', 'admin@library.com')).toBe('E2E Admin');
  });

  it('falls back to the email prefix without exposing the full email', () => {
    expect(resolveDisplayName(null, 'admin@library.com')).toBe('admin');
    expect(resolveDisplayName('   ', 'reader@library.com')).toBe('reader');
  });

  it('uses a generic label when nothing usable exists', () => {
    expect(resolveDisplayName(null, null)).toBe('Account');
  });
});

describe('getGreetingName', () => {
  it('uses the first word of the display name', () => {
    expect(getGreetingName('Anar Safarli')).toBe('Anar');
    expect(getGreetingName('Admin')).toBe('Admin');
  });
});

describe('getInitials', () => {
  it('uses first and last word initials', () => {
    expect(getInitials('E2E Admin')).toBe('EA');
    expect(getInitials('Ali Safarli')).toBe('AS');
  });

  it('uses up to two characters for a single word', () => {
    expect(getInitials('Admin')).toBe('AD');
  });
});
