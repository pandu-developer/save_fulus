import { useMemo } from 'react';

import {
  addDays,
  daysInMonth,
  monthEnd,
  monthStart,
  sameMonth,
  shiftMonth,
  startOfDay,
  startOfWeek,
  type YearMonth,
} from '@/lib/date';
import { BUDGET_NEAR, DEFAULT_CATEGORIES, DEFAULT_METHODS } from './defaults';
import { useStore } from './store';
import type { Category, Goal, PaymentMethod, Transaction, TxType } from './types';

// ---------------------------------------------------------------------------
// Kategori & metode (bawaan + custom)
// ---------------------------------------------------------------------------

export function useCategories(): Category[] {
  const custom = useStore((s) => s.customCategories);
  return useMemo(() => [...DEFAULT_CATEGORIES, ...custom], [custom]);
}

export function useMethods(): PaymentMethod[] {
  const custom = useStore((s) => s.customMethods);
  return useMemo(() => [...DEFAULT_METHODS, ...custom], [custom]);
}

export function useCategoryMap(): Map<string, Category> {
  const cats = useCategories();
  return useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
}

export function useMethodMap(): Map<string, PaymentMethod> {
  const methods = useMethods();
  return useMemo(() => new Map(methods.map((m) => [m.id, m])), [methods]);
}

const UNKNOWN: Record<TxType, Category> = {
  expense: { id: 'lain_keluar', label: 'Lainnya', icon: 'ellipsis-horizontal-outline', type: 'expense' },
  income: { id: 'lain_masuk', label: 'Lainnya', icon: 'ellipsis-horizontal-outline', type: 'income' },
};

export function categoryOf(map: Map<string, Category>, tx: Pick<Transaction, 'categoryId' | 'type'>): Category {
  return map.get(tx.categoryId) ?? UNKNOWN[tx.type];
}

/** Judul transaksi: catatan bila ada, kalau tidak nama kategorinya. */
export function txTitle(tx: Transaction, cat: Category): string {
  return tx.note.trim() || cat.label;
}

// ---------------------------------------------------------------------------
// Agregasi
// ---------------------------------------------------------------------------

export interface Totals {
  income: number;
  expense: number;
  count: number;
}

export function totalsBetween(txs: Transaction[], start: Date, end: Date): Totals {
  const s = start.getTime();
  const e = end.getTime();
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const t of txs) {
    const ts = Date.parse(t.date);
    if (ts < s || ts >= e) continue;
    count += 1;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, count };
}

export function monthTotals(txs: Transaction[], ym: YearMonth): Totals {
  return totalsBetween(txs, monthStart(ym), monthEnd(ym));
}

export function balanceOf(txs: Transaction[], initial: number): number {
  let b = initial;
  for (const t of txs) b += t.type === 'income' ? t.amount : -t.amount;
  return b;
}

export function expenseByCategory(txs: Transaction[], start: Date, end: Date): Map<string, number> {
  const s = start.getTime();
  const e = end.getTime();
  const out = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const ts = Date.parse(t.date);
    if (ts < s || ts >= e) continue;
    out.set(t.categoryId, (out.get(t.categoryId) ?? 0) + t.amount);
  }
  return out;
}

/** Pengeluaran per hari dalam satu bulan (indeks 0 = tanggal 1). */
export function dailyExpense(txs: Transaction[], ym: YearMonth): number[] {
  const days = new Array<number>(daysInMonth(ym.y, ym.m)).fill(0);
  const s = monthStart(ym).getTime();
  const e = monthEnd(ym).getTime();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const ts = Date.parse(t.date);
    if (ts < s || ts >= e) continue;
    days[new Date(ts).getDate() - 1] += t.amount;
  }
  return days;
}

export function cumulative(values: number[]): number[] {
  let acc = 0;
  return values.map((v) => (acc += v));
}

export interface WeekTotal {
  start: Date;
  total: number;
}

/** Total pengeluaran per minggu (Senin–Minggu), dari yang terlama; terakhir = minggu ini. */
export function weeklyExpense(txs: Transaction[], weeks: number, now = new Date()): WeekTotal[] {
  const thisWeek = startOfWeek(now);
  const starts = Array.from({ length: weeks }, (_, i) => addDays(thisWeek, -7 * (weeks - 1 - i)));
  const out = starts.map((start) => ({ start, total: 0 }));
  const first = starts[0].getTime();
  const last = addDays(thisWeek, 7).getTime();
  for (const t of txs) {
    if (t.type !== 'expense') continue;
    const ts = Date.parse(t.date);
    if (ts < first || ts >= last) continue;
    const idx = Math.floor((startOfDay(new Date(ts)).getTime() - first) / (7 * 86400000));
    // Math.floor aman karena rentang lokal; batasi untuk jaga-jaga pergantian DST.
    out[Math.min(Math.max(idx, 0), weeks - 1)].total += t.amount;
  }
  return out;
}

/** Bulan-bulan yang punya transaksi, terbaru dulu. */
export function monthsWithData(txs: Transaction[]): YearMonth[] {
  const seen = new Set<string>();
  const out: YearMonth[] = [];
  for (const t of txs) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ y: d.getFullYear(), m: d.getMonth() });
  }
  return out.sort((a, b) => b.y - a.y || b.m - a.m);
}

/** Seberapa sering kategori dipakai 90 hari terakhir — untuk mengurutkan pilihan. */
export function categoryUsage(txs: Transaction[], type: TxType, now = new Date()): Map<string, number> {
  const since = addDays(now, -90).getTime();
  const out = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== type) continue;
    if (Date.parse(t.date) < since) break; // txs terurut terbaru dulu
    out.set(t.categoryId, (out.get(t.categoryId) ?? 0) + 1);
  }
  return out;
}

/**
 * Periode pembanding yang adil: untuk bulan berjalan, bandingkan tanggal 1–hari ini
 * dengan tanggal yang sama bulan lalu. Untuk bulan yang sudah lewat, bulan penuh.
 */
export function comparisonRanges(ym: YearMonth, now = new Date()) {
  const prev = shiftMonth(ym, -1);
  const isCurrent = sameMonth(ym, { y: now.getFullYear(), m: now.getMonth() });
  if (!isCurrent) {
    return {
      isCurrent,
      prev,
      cur: [monthStart(ym), monthEnd(ym)] as const,
      before: [monthStart(prev), monthEnd(prev)] as const,
    };
  }
  const dayCount = now.getDate();
  const prevDays = daysInMonth(prev.y, prev.m);
  return {
    isCurrent,
    prev,
    cur: [monthStart(ym), addDays(startOfDay(now), 1)] as const,
    before: [monthStart(prev), new Date(prev.y, prev.m, Math.min(dayCount, prevDays) + 1)] as const,
  };
}

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

export type BudgetStatus = 'ok' | 'near' | 'over';

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  ok: 'Aman',
  near: 'Mendekati batas',
  over: 'Melebihi budget',
};

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return 'ok';
  const r = spent / limit;
  if (r > 1) return 'over';
  if (r >= BUDGET_NEAR) return 'near';
  return 'ok';
}

/** Sisa hari di bulan berjalan, termasuk hari ini. */
export function daysLeftInMonth(now = new Date()): number {
  return daysInMonth(now.getFullYear(), now.getMonth()) - now.getDate() + 1;
}

// ---------------------------------------------------------------------------
// Impian
// ---------------------------------------------------------------------------

export function goalSaved(goal: Goal): number {
  return goal.entries.reduce((sum, e) => sum + e.amount, 0);
}

export function goalProgress(goal: Goal): number {
  return goal.targetAmount > 0 ? Math.max(0, goalSaved(goal) / goal.targetAmount) : 0;
}

/**
 * Perkiraan kapan target tercapai berdasarkan kecepatan menabung sejauh ini.
 * Setoran pertama (sering berupa saldo awal) tidak dihitung sebagai kecepatan.
 */
export function goalEta(goal: Goal, now = new Date()): { date: Date; perMonth: number } | null {
  const remaining = goal.targetAmount - goalSaved(goal);
  if (remaining <= 0) return null;
  const sorted = [...goal.entries].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return null;
  const spanDays = (now.getTime() - Date.parse(sorted[0].date)) / 86400000;
  if (spanDays < 28) return null;
  const afterFirst = sorted.slice(1).reduce((sum, e) => sum + e.amount, 0);
  const perMonth = afterFirst / (spanDays / 30.44);
  if (perMonth <= 0) return null;
  const months = Math.ceil(remaining / perMonth);
  if (months > 120) return null; // lebih dari 10 tahun — tidak bermakna
  return { date: new Date(now.getFullYear(), now.getMonth() + months, 1), perMonth };
}
