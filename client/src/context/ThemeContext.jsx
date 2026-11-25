import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/*
 * Theme preference: 'light' | 'dark' | 'system'.
 *
 * - The chosen preference is the only thing stored in localStorage (UI only,
 *   never app data). Storage can be unavailable (private mode, blocked site
 *   data), so every access is wrapped and the app still works without it.
 * - 'system' follows the operating system's colour scheme, live.
 * - The resolved theme is applied as <html data-theme="light|dark">; the CSS
 *   tokens in index.css switch on that attribute.
 * - index.html runs the same logic in a tiny inline script before React
 *   loads, so the first paint is already in the right theme (no flash).
 */
export const THEME_STORAGE_KEY = 'subtrack-theme';
const PREFERENCES = ['light', 'dark', 'system'];
const THEME_COLORS = { dark: '#0d0f14', light: '#f6f7fb' }; // browser UI colour (mobile address bar)

const ThemeContext = createContext(null);

function readPreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return PREFERENCES.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(resolved) {
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [systemTheme, setSystemTheme] = useState(() => (systemQuery().matches ? 'dark' : 'light'));

  // Follow OS changes (only matters while the preference is 'system').
  useEffect(() => {
    const query = systemQuery();
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setPreferenceState(readPreference());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((next) => {
    if (!PREFERENCES.includes(next)) return;
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice still applies for this visit */
    }
  }, []);

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
