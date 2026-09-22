import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type TabParamList = {
  Beranda: undefined;
  Transaksi: undefined;
  Impian: undefined;
  Laporan: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  AddTransaction: { transactionId?: string } | undefined;
  AddGoal: { goalId?: string } | undefined;
  GoalDetail: { goalId: string };
};

// Navigasi untuk layar-layar di dalam tab (bisa pindah tab + buka layar stack)
export type TabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Navigasi untuk layar stack (mis. Tambah/Edit Transaksi)
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
