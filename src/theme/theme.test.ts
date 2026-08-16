import { afterEach, describe, expect, it } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyThemePreference,
  getStoredThemePreference,
  resolveTheme,
} from './theme';

describe('theme', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-preference');
  });

  it('resolves light, dark, and system preferences', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('persists preference and applies resolved theme', () => {
    applyThemePreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(getStoredThemePreference()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme-preference')).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyThemePreference('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme-preference')).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('restores the stored preference after a simulated reload', () => {
    applyThemePreference('dark');
    expect(getStoredThemePreference()).toBe('dark');

    document.documentElement.removeAttribute('data-theme');
    applyThemePreference(getStoredThemePreference());

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
