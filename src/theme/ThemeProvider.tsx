import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { useStore } from '@/data/store';
import { palettes, type Palette, type Scheme } from './tokens';

interface ThemeValue {
  scheme: Scheme;
  isDark: boolean;
  c: Palette;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const mode = useStore((s) => s.settings.themeMode);
  const scheme: Scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const value = useMemo(
    () => ({ scheme, isDark: scheme === 'dark', c: palettes[scheme] }),
    [scheme],
  );

  // Warna root view native — mencegah kilatan putih saat transisi di mode gelap.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(value.c.bg).catch(() => {});
  }, [value.c.bg]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useAppTheme harus dipakai di dalam AppThemeProvider');
  return v;
}

/** StyleSheet yang mengikuti tema. `factory` harus fungsi level-modul (referensi stabil). */
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const { c } = useAppTheme();
  return useMemo(() => factory(c), [c, factory]);
}
