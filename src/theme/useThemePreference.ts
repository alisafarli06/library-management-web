import { useEffect, useState } from 'react';
import {
  applyThemePreference,
  getStoredThemePreference,
  type ResolvedTheme,
  resolveTheme,
  type ThemePreference,
} from './theme';

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(getStoredThemePreference()));

  useEffect(() => {
    setResolved(applyThemePreference(preference));
  }, [preference]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getStoredThemePreference() === 'system') {
        setResolved(applyThemePreference('system'));
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    setResolved(applyThemePreference(next));
  }

  return { preference, resolved, setPreference };
}
