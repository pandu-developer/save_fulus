import { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';

import { ToastProvider } from '@/components/ui/Toast';
import { hydrate, useStore } from '@/data/store';
import { configureReminderHandler } from '@/lib/reminder';
import { AppThemeProvider, useAppTheme } from '@/theme/ThemeProvider';
import { font } from '@/theme/tokens';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
  });
  const hydrated = useStore((s) => s.hydrated);
  const reminderEnabled = useStore((s) => s.settings.reminderEnabled);
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (hydrated && reminderEnabled) configureReminderHandler();
  }, [hydrated, reminderEnabled]);

  // Splash tetap tampil sampai font & data siap — tidak ada kedipan layar kosong.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <ToastProvider>
          <RootStack />
        </ToastProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { c, isDark } = useAppTheme();

  const navTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: c.accent,
        background: c.bg,
        card: c.bg,
        text: c.ink,
        border: c.line,
        notification: c.negative,
      },
      fonts: {
        regular: { fontFamily: font.regular, fontWeight: 'normal' },
        medium: { fontFamily: font.medium, fontWeight: 'normal' },
        bold: { fontFamily: font.semibold, fontWeight: 'normal' },
        heavy: { fontFamily: font.semibold, fontWeight: 'normal' },
      },
    };
  }, [c, isDark]);

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tambah" options={{ presentation: 'modal' }} />
        <Stack.Screen name="kategori-baru" options={{ presentation: 'modal' }} />
        <Stack.Screen name="impian/baru" options={{ presentation: 'modal' }} />
        <Stack.Screen name="impian/[id]" />
        <Stack.Screen name="kategori" />
        <Stack.Screen name="metode" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
