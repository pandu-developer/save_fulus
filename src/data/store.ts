import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { DEFAULT_SETTINGS, FALLBACK_CATEGORY, LEGACY_CATEGORIES } from './defaults';
import type {
  Budgets,
  Category,
  Goal,
  GoalEntry,
  IconName,
  PaymentMethod,
  Settings,
  Snapshot,
  Transaction,
  TxInput,
  TxType,
} from './types';

// Kunci lama (v1) dipertahankan agar data yang sudah ada tetap terbaca.
const KEYS = {
  transactions: '@pencatat_uang/transactions',
  goals: '@pencatat_uang/goals',
  customCategories: '@pencatat_uang/categories',
  customMethods: '@pencatat_uang/methods',
  budgets: '@pencatat_uang/budgets',
  settings: '@pencatat_uang/settings',
} as const;
const LEGACY_THEME_KEY = '@pencatat_uang/theme';

type PersistedKey = keyof typeof KEYS;

export interface AppState extends Snapshot {
  hydrated: boolean;
  // Transaksi yang baru disimpan — dipakai untuk animasi baris baru, dibersihkan otomatis.
  flashId: string | null;
  // Kategori yang baru dibuat — dipilih otomatis oleh form transaksi.
  lastCreatedCategoryId: string | null;
}

let state: AppState = {
  hydrated: false,
  transactions: [],
  customCategories: [],
  customMethods: [],
  budgets: {},
  goals: [],
  settings: DEFAULT_SETTINGS,
  flashId: null,
  lastCreatedCategoryId: null,
};

let flashTimer: ReturnType<typeof setTimeout> | undefined;

function flash(id: string): Partial<AppState> {
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => update({ flashId: null }), 3000);
  return { flashId: id };
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getState(): AppState {
  return state;
}

/** Selector harus mengembalikan referensi stabil (slice state), bukan objek baru. */
export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

function persist(keys: PersistedKey[]) {
  const pairs: [string, string][] = keys.map((k) => [KEYS[k], JSON.stringify(state[k])]);
  AsyncStorage.multiSet(pairs).catch((e) => console.warn('Gagal menyimpan data:', e));
}

function update(patch: Partial<AppState>, persistKeys: PersistedKey[] = []) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  if (persistKeys.length) persist(persistKeys);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Urutan kanonik: tanggal terbaru dulu, lalu yang terakhir dicatat.
function sortTx(list: Transaction[]): Transaction[] {
  return [...list].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

// ---------------------------------------------------------------------------
// Validasi & migrasi (data dari storage/backup tidak dipercaya begitu saja)
// ---------------------------------------------------------------------------

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const isIsoDate = (x: unknown): x is string =>
  typeof x === 'string' && !Number.isNaN(Date.parse(x));

function validIcon(name: unknown, fallback: IconName): IconName {
  if (typeof name !== 'string') return fallback;
  const glyphs = Ionicons.glyphMap as Record<string, number>;
  // Versi lama memakai ikon "filled"; ganti ke varian outline agar konsisten.
  if (!name.endsWith('-outline') && `${name}-outline` in glyphs) return `${name}-outline` as IconName;
  return name in glyphs ? (name as IconName) : fallback;
}

function toTransaction(x: unknown): Transaction | null {
  if (!isObj(x)) return null;
  const { id, type, amount, categoryId, date } = x;
  if (typeof id !== 'string' || (type !== 'income' && type !== 'expense')) return null;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  if (typeof categoryId !== 'string' || !isIsoDate(date)) return null;
  return {
    id,
    type,
    amount: Math.round(amount),
    categoryId,
    methodId: typeof x.methodId === 'string' ? x.methodId : undefined,
    note: typeof x.note === 'string' ? x.note : '',
    date,
    createdAt: isIsoDate(x.createdAt) ? x.createdAt : date,
  };
}

function toCategory(x: unknown): Category | null {
  if (!isObj(x) || typeof x.id !== 'string' || typeof x.label !== 'string') return null;
  if (x.type !== 'income' && x.type !== 'expense') return null;
  return {
    id: x.id,
    label: x.label,
    type: x.type,
    icon: validIcon(x.icon, 'pricetag-outline'),
    custom: true,
  };
}

function toMethod(x: unknown): PaymentMethod | null {
  if (!isObj(x) || typeof x.id !== 'string' || typeof x.label !== 'string') return null;
  return { id: x.id, label: x.label, icon: validIcon(x.icon, 'wallet-outline'), custom: true };
}

function toGoal(x: unknown): Goal | null {
  if (!isObj(x) || typeof x.id !== 'string' || typeof x.name !== 'string') return null;
  if (typeof x.targetAmount !== 'number' || !(x.targetAmount > 0)) return null;
  const entries: GoalEntry[] = Array.isArray(x.entries)
    ? x.entries.flatMap((e): GoalEntry[] =>
        isObj(e) && typeof e.id === 'string' && typeof e.amount === 'number' && isIsoDate(e.date)
          ? [{ id: e.id, amount: Math.round(e.amount), date: e.date }]
          : [],
      )
    : [];
  return {
    id: x.id,
    name: x.name,
    targetAmount: Math.round(x.targetAmount),
    icon: validIcon(x.icon, 'sparkles-outline'),
    note: typeof x.note === 'string' ? x.note : undefined,
    entries,
    createdAt: isIsoDate(x.createdAt) ? x.createdAt : new Date().toISOString(),
  };
}

function toBudgets(x: unknown): Budgets {
  if (!isObj(x)) return {};
  const out: Budgets = {};
  for (const [k, v] of Object.entries(x)) {
    if (typeof v === 'number' && v > 0) out[k] = Math.round(v);
  }
  return out;
}

function toSettings(x: unknown): Settings {
  if (!isObj(x)) return DEFAULT_SETTINGS;
  const s = { ...DEFAULT_SETTINGS };
  if (typeof x.name === 'string') s.name = x.name;
  if (typeof x.initialBalance === 'number') s.initialBalance = Math.round(x.initialBalance);
  if (typeof x.monthlyBudget === 'number' && x.monthlyBudget >= 0) s.monthlyBudget = Math.round(x.monthlyBudget);
  if (typeof x.hideAmounts === 'boolean') s.hideAmounts = x.hideAmounts;
  if (x.themeMode === 'system' || x.themeMode === 'light' || x.themeMode === 'dark') s.themeMode = x.themeMode;
  if (typeof x.reminderEnabled === 'boolean') s.reminderEnabled = x.reminderEnabled;
  if (typeof x.reminderHour === 'number') s.reminderHour = x.reminderHour;
  if (typeof x.reminderMinute === 'number') s.reminderMinute = x.reminderMinute;
  if (isObj(x.lastMethod)) {
    s.lastMethod = {
      expense: typeof x.lastMethod.expense === 'string' ? x.lastMethod.expense : undefined,
      income: typeof x.lastMethod.income === 'string' ? x.lastMethod.income : undefined,
    };
  }
  return s;
}

const list = <T,>(raw: unknown, map: (x: unknown) => T | null): T[] =>
  Array.isArray(raw) ? raw.flatMap((x) => {
    const v = map(x);
    return v ? [v] : [];
  }) : [];

/** Validasi snapshot mentah (dari storage atau file backup). */
export function toSnapshot(raw: Record<string, unknown>): Snapshot {
  const transactions = sortTx(list(raw.transactions, toTransaction));
  const customCategories = list(raw.customCategories, toCategory);
  // Pulihkan kategori bawaan lama yang masih direferensikan transaksi.
  for (const t of transactions) {
    const legacy = LEGACY_CATEGORIES[t.categoryId];
    if (legacy && !customCategories.some((c) => c.id === t.categoryId)) {
      customCategories.push({ id: t.categoryId, ...legacy });
    }
  }
  return {
    transactions,
    customCategories,
    customMethods: list(raw.customMethods, toMethod),
    budgets: toBudgets(raw.budgets),
    goals: list(raw.goals, toGoal),
    settings: toSettings(raw.settings),
  };
}

function safeParse(raw: string | null | undefined): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export async function hydrate(): Promise<void> {
  if (state.hydrated) return;
  try {
    const entries = await AsyncStorage.multiGet([...Object.values(KEYS), LEGACY_THEME_KEY]);
    const map = Object.fromEntries(entries) as Record<string, string | null>;
    const raw: Record<string, unknown> = {};
    for (const k of Object.keys(KEYS) as PersistedKey[]) raw[k] = safeParse(map[KEYS[k]]);
    const snap = toSnapshot(raw);
    // Migrasi pilihan tema dari versi lama
    const legacyTheme = map[LEGACY_THEME_KEY];
    if (raw.settings === undefined && (legacyTheme === 'light' || legacyTheme === 'dark')) {
      snap.settings = { ...snap.settings, themeMode: legacyTheme };
    }
    update({ ...snap, hydrated: true });
  } catch (e) {
    console.warn('Gagal memuat data:', e);
    update({ hydrated: true });
  }
}

// ---------------------------------------------------------------------------
// Transaksi
// ---------------------------------------------------------------------------

export function addTransaction(input: TxInput): Transaction {
  const tx: Transaction = { ...input, id: uid(), createdAt: new Date().toISOString() };
  const settings: Settings = input.methodId
    ? { ...state.settings, lastMethod: { ...state.settings.lastMethod, [input.type]: input.methodId } }
    : state.settings;
  update({ transactions: sortTx([tx, ...state.transactions]), settings, ...flash(tx.id) }, [
    'transactions',
    'settings',
  ]);
  return tx;
}

export function updateTransaction(id: string, input: TxInput) {
  update(
    { transactions: sortTx(state.transactions.map((t) => (t.id === id ? { ...t, ...input } : t))) },
    ['transactions'],
  );
}

export function removeTransaction(id: string): Transaction | undefined {
  const removed = state.transactions.find((t) => t.id === id);
  if (removed) {
    update({ transactions: state.transactions.filter((t) => t.id !== id) }, ['transactions']);
  }
  return removed;
}

export function restoreTransaction(tx: Transaction) {
  if (state.transactions.some((t) => t.id === tx.id)) return;
  update({ transactions: sortTx([tx, ...state.transactions]), ...flash(tx.id) }, ['transactions']);
}

// ---------------------------------------------------------------------------
// Kategori & metode pembayaran
// ---------------------------------------------------------------------------

/** `select`: kategori baru langsung dipilih oleh form transaksi yang sedang terbuka. */
export function addCategory(input: { label: string; icon: IconName; type: TxType }, select = false): Category {
  const cat: Category = { ...input, label: input.label.trim(), id: `c_${uid()}`, custom: true };
  update(
    {
      customCategories: [...state.customCategories, cat],
      lastCreatedCategoryId: select ? cat.id : state.lastCreatedCategoryId,
    },
    ['customCategories'],
  );
  return cat;
}

export function consumeCreatedCategory(): string | null {
  const id = state.lastCreatedCategoryId;
  if (id) update({ lastCreatedCategoryId: null });
  return id;
}

/** Menghapus kategori custom. Transaksinya dipindah ke "Lainnya". Mengembalikan jumlah yang dipindah. */
export function removeCategory(id: string): number {
  const cat = state.customCategories.find((c) => c.id === id);
  if (!cat) return 0;
  const fallback = FALLBACK_CATEGORY[cat.type];
  let moved = 0;
  const transactions = state.transactions.map((t) => {
    if (t.categoryId !== id) return t;
    moved += 1;
    return { ...t, categoryId: fallback };
  });
  const budgets = { ...state.budgets };
  delete budgets[id];
  update(
    {
      customCategories: state.customCategories.filter((c) => c.id !== id),
      transactions,
      budgets,
    },
    ['customCategories', 'transactions', 'budgets'],
  );
  return moved;
}

export function addMethod(input: { label: string; icon: IconName }): PaymentMethod {
  const m: PaymentMethod = { ...input, label: input.label.trim(), id: `m_${uid()}`, custom: true };
  update({ customMethods: [...state.customMethods, m] }, ['customMethods']);
  return m;
}

export function removeMethod(id: string) {
  const transactions = state.transactions.map((t) =>
    t.methodId === id ? { ...t, methodId: undefined } : t,
  );
  const lastMethod = { ...state.settings.lastMethod };
  (Object.keys(lastMethod) as TxType[]).forEach((k) => {
    if (lastMethod[k] === id) delete lastMethod[k];
  });
  update(
    {
      customMethods: state.customMethods.filter((m) => m.id !== id),
      transactions,
      settings: { ...state.settings, lastMethod },
    },
    ['customMethods', 'transactions', 'settings'],
  );
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export function setBudget(categoryId: string, amount: number) {
  const budgets = { ...state.budgets };
  if (amount > 0) budgets[categoryId] = Math.round(amount);
  else delete budgets[categoryId];
  update({ budgets }, ['budgets']);
}

// ---------------------------------------------------------------------------
// Impian (target tabungan)
// ---------------------------------------------------------------------------

export function addGoal(input: { name: string; targetAmount: number; icon: IconName; initial?: number }): Goal {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: uid(),
    name: input.name.trim(),
    targetAmount: Math.round(input.targetAmount),
    icon: input.icon,
    entries: input.initial && input.initial > 0 ? [{ id: uid(), amount: Math.round(input.initial), date: now }] : [],
    createdAt: now,
  };
  update({ goals: [...state.goals, goal] }, ['goals']);
  return goal;
}

export function updateGoal(id: string, patch: Partial<Pick<Goal, 'name' | 'targetAmount' | 'icon'>>) {
  update({ goals: state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }, ['goals']);
}

export function removeGoal(id: string): Goal | undefined {
  const goal = state.goals.find((g) => g.id === id);
  if (goal) update({ goals: state.goals.filter((g) => g.id !== id) }, ['goals']);
  return goal;
}

export function restoreGoal(goal: Goal) {
  if (state.goals.some((g) => g.id === goal.id)) return;
  update({ goals: [...state.goals, goal] }, ['goals']);
}

export function addGoalEntry(goalId: string, amount: number): GoalEntry {
  const entry: GoalEntry = { id: uid(), amount: Math.round(amount), date: new Date().toISOString() };
  update(
    { goals: state.goals.map((g) => (g.id === goalId ? { ...g, entries: [...g.entries, entry] } : g)) },
    ['goals'],
  );
  return entry;
}

export function removeGoalEntry(goalId: string, entryId: string): GoalEntry | undefined {
  const entry = state.goals.find((g) => g.id === goalId)?.entries.find((e) => e.id === entryId);
  if (!entry) return undefined;
  update(
    {
      goals: state.goals.map((g) =>
        g.id === goalId ? { ...g, entries: g.entries.filter((e) => e.id !== entryId) } : g,
      ),
    },
    ['goals'],
  );
  return entry;
}

export function restoreGoalEntry(goalId: string, entry: GoalEntry) {
  update(
    {
      goals: state.goals.map((g) =>
        g.id === goalId
          ? { ...g, entries: [...g.entries, entry].sort((a, b) => a.date.localeCompare(b.date)) }
          : g,
      ),
    },
    ['goals'],
  );
}

// ---------------------------------------------------------------------------
// Pengaturan & seluruh data
// ---------------------------------------------------------------------------

export function updateSettings(patch: Partial<Settings>) {
  update({ settings: { ...state.settings, ...patch } }, ['settings']);
}

export function getSnapshot(): Snapshot {
  const { transactions, customCategories, customMethods, budgets, goals, settings } = state;
  return { transactions, customCategories, customMethods, budgets, goals, settings };
}

/** Ganti seluruh data (dipakai oleh data contoh & pulihkan backup). */
export function replaceAll(snap: Snapshot) {
  update({ ...snap, transactions: sortTx(snap.transactions), flashId: null }, [
    'transactions',
    'customCategories',
    'customMethods',
    'budgets',
    'goals',
    'settings',
  ]);
}

export function resetAll() {
  replaceAll({
    transactions: [],
    customCategories: [],
    customMethods: [],
    budgets: {},
    goals: [],
    // Tema & nama dipertahankan — itu preferensi, bukan data keuangan.
    settings: { ...DEFAULT_SETTINGS, themeMode: state.settings.themeMode, name: state.settings.name },
  });
}
