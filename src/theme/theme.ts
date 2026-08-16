export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'library.theme';

const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) {
      return stored;
    }
  } catch {
    // localStorage may be unavailable in private browsing or test environments.
  }
  return 'system';
}

export function resolveTheme(preference: ThemePreference, systemDark = prefersDarkScheme()): ResolvedTheme {
  if (preference === 'system') {
    return systemDark ? 'dark' : 'light';
  }
  return preference;
}

export function prefersDarkScheme(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyResolvedTheme(resolved: ResolvedTheme, preference: ThemePreference = getStoredThemePreference()): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-preference', preference);
  document.documentElement.style.colorScheme = resolved;
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore persistence failures; still apply for the current session.
  }
  const resolved = resolveTheme(preference);
  applyResolvedTheme(resolved, preference);
  return resolved;
}

export function initTheme(): () => void {
  const preference = getStoredThemePreference();
  applyThemePreference(preference);

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (getStoredThemePreference() === 'system') {
      applyThemePreference('system');
    }
  };

  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
