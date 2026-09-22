import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavingsGoal, Transaction } from '../types';

const TX_KEY = '@pencatat_uang/transactions';
const GOALS_KEY = '@pencatat_uang/goals';

// ---- Transaksi ----

export async function loadTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(TX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Transaction[];
  } catch (e) {
    console.warn('Gagal memuat transaksi:', e);
    return [];
  }
}

export async function saveTransactions(items: Transaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TX_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Gagal menyimpan transaksi:', e);
  }
}

// ---- Impian ----

export async function loadGoals(): Promise<SavingsGoal[]> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavingsGoal[];
  } catch (e) {
    console.warn('Gagal memuat impian:', e);
    return [];
  }
}

export async function saveGoals(items: SavingsGoal[]): Promise<void> {
  try {
    await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Gagal menyimpan impian:', e);
  }
}
