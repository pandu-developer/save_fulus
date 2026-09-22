import React from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TransactionsProvider } from './src/context/TransactionsContext';
import { GoalsProvider } from './src/context/GoalsContext';
import { RootStackParamList, TabParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ImpianScreen from './src/screens/ImpianScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AddGoalScreen from './src/screens/AddGoalScreen';
import GoalDetailScreen from './src/screens/GoalDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, { on: string; off: string }> = {
  Beranda: { on: 'home', off: 'home-outline' },
  Transaksi: { on: 'swap-horizontal', off: 'swap-horizontal-outline' },
  Impian: { on: 'sparkles', off: 'sparkles-outline' },
  Laporan: { on: 'pie-chart', off: 'pie-chart-outline' },
};

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icon = ICONS[route.name];
          return (
            <Ionicons
              name={(focused ? icon.on : icon.off) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Transaksi" component={TransactionsScreen} />
      <Tab.Screen name="Impian" component={ImpianScreen} />
      <Tab.Screen name="Laporan" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
      notification: colors.expense,
    },
  };

  return (
    <>
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={Tabs} />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="AddGoal"
            component={AddGoalScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TransactionsProvider>
          <GoalsProvider>
            <RootNavigator />
          </GoalsProvider>
        </TransactionsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
