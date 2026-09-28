import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // Rupiah, bilangan bulat positif; arah ditentukan `type`
  categoryId: string;
  methodId?: string; // metode pembayaran
  note: string; // nama transaksi, mis. "Makan siang" (boleh kosong)
  date: string; // ISO — kapan transaksi terjadi
  createdAt: string; // ISO — kapan dicatat
}

export type TxInput = Omit<Transaction, 'id' | 'createdAt'>;

export interface Category {
  id: string;
  label: string;
  icon: IconName;
  type: TxType;
  custom?: boolean;
}

export interface PaymentMethod {
  id: string;
  label: string;
  icon: IconName;
  custom?: boolean;
}

// Batas pengeluaran bulanan per kategori (id kategori -> Rupiah)
export type Budgets = Record<string, number>;

export interface GoalEntry {
  id: string;
  amount: number; // positif = menabung, negatif = ditarik
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  icon: IconName;
  note?: string;
  entries: GoalEntry[];
  createdAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  name: string;
  initialBalance: number; // saldo awal sebelum mulai mencatat
  monthlyBudget: number; // target budget bulanan total (0 = belum diatur)
  hideAmounts: boolean; // sembunyikan nominal di Beranda
  themeMode: ThemeMode;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  lastMethod: Partial<Record<TxType, string>>; // metode terakhir per jenis
}

// Data yang dipersist & dipakai untuk backup
export interface Snapshot {
  transactions: Transaction[];
  customCategories: Category[];
  customMethods: PaymentMethod[];
  budgets: Budgets;
  goals: Goal[];
  settings: Settings;
}
