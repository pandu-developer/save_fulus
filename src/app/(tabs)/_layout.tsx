import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, hairline } from '@/theme/tokens';

// Ikon outline di semua state agar ketebalan garis seragam; state aktif ditandai warna aksen.
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Beranda', icon: 'home-outline' },
  { name: 'transaksi', title: 'Transaksi', icon: 'list-outline' },
  { name: 'budget', title: 'Budget', icon: 'wallet-outline' },
  { name: 'statistik', title: 'Statistik', icon: 'stats-chart-outline' },
  { name: 'profil', title: 'Profil', icon: 'person-outline' },
];

export default function TabsLayout() {
  const { c } = useAppTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.ink3,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.line,
          borderTopWidth: hairline,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size - 2} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
