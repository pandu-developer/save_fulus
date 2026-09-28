import {
  addDays,
  BULAN,
  daysInMonth,
  startOfDay,
  startOfWeek,
  type YearMonth,
} from '@/lib/date';
import { percent, rupiah } from '@/lib/format';
import {
  comparisonRanges,
  dailyExpense,
  expenseByCategory,
  totalsBetween,
} from './selectors';
import type { Category, IconName, Transaction } from './types';

export type InsightTone = 'neutral' | 'positive' | 'negative';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: IconName;
  text: string;
}

/** Label periode pembanding, mis. "1–25 Agustus" atau "Juli". */
export function comparisonLabel(ym: YearMonth, now = new Date()): string {
  const { isCurrent, prev, before } = comparisonRanges(ym, now);
  if (!isCurrent) return BULAN[prev.m];
  const lastDay = addDays(before[1], -1).getDate();
  return lastDay === 1 ? `1 ${BULAN[prev.m]}` : `1–${lastDay} ${BULAN[prev.m]}`;
}

// Nominal minimal agar perubahan dianggap bermakna (hindari "naik 200%" dari Rp5.000).
const MIN_AMOUNT = 50000;

/**
 * Insight hanya dibuat dari data yang ada — tidak ada kalimat yang muncul
 * tanpa angka pendukung. Urutan = prioritas.
 */
export function buildInsights(params: {
  txs: Transaction[];
  ym: YearMonth;
  categoryMap: Map<string, Category>;
  monthlyBudget: number;
  now?: Date;
}): Insight[] {
  const { txs, ym, categoryMap, monthlyBudget } = params;
  const now = params.now ?? new Date();
  const out: Insight[] = [];
  const { isCurrent, cur, before } = comparisonRanges(ym, now);
  const vs = comparisonLabel(ym, now);
  const curTotals = totalsBetween(txs, cur[0], cur[1]);
  const prevTotals = totalsBetween(txs, before[0], before[1]);
  const labelOf = (id: string) => categoryMap.get(id)?.label ?? 'Lainnya';

  if (curTotals.count === 0) return out;

  // 1. Arah budget bulan berjalan (butuh beberapa hari data agar proyeksi masuk akal)
  if (isCurrent && monthlyBudget > 0) {
    const dim = daysInMonth(ym.y, ym.m);
    const day = now.getDate();
    const spent = curTotals.expense;
    if (spent > monthlyBudget) {
      out.push({
        id: 'budget-over',
        tone: 'negative',
        icon: 'alert-circle-outline',
        text: `Pengeluaran bulan ini sudah melewati budget sebesar ${rupiah(spent - monthlyBudget)}.`,
      });
    } else if (day >= 5) {
      const projected = Math.round(((spent / day) * dim) / 1000) * 1000;
      if (projected > monthlyBudget) {
        out.push({
          id: 'budget-projection',
          tone: 'negative',
          icon: 'trending-up-outline',
          text: `Dengan pola sekarang, pengeluaran akhir bulan diperkirakan ${rupiah(projected)} — lebih ${rupiah(projected - monthlyBudget)} dari budget.`,
        });
      } else {
        const perDay = Math.floor((monthlyBudget - spent) / (dim - day + 1) / 500) * 500;
        out.push({
          id: 'budget-pace',
          tone: 'positive',
          icon: 'checkmark-circle-outline',
          text: `Sisa budget cukup untuk ${rupiah(perDay)} per hari sampai akhir bulan.`,
        });
      }
    }
  }

  // 2. Kategori dengan kenaikan terbesar dibanding periode pembanding
  const curCat = expenseByCategory(txs, cur[0], cur[1]);
  const prevCat = expenseByCategory(txs, before[0], before[1]);
  let up: { id: string; diff: number; pct: number } | null = null;
  let down: { id: string; diff: number; pct: number } | null = null;
  for (const id of new Set([...curCat.keys(), ...prevCat.keys()])) {
    const a = curCat.get(id) ?? 0;
    const b = prevCat.get(id) ?? 0;
    if (b < MIN_AMOUNT) continue;
    const diff = a - b;
    const pct = diff / b;
    if (diff >= MIN_AMOUNT && pct >= 0.15 && (!up || diff > up.diff)) up = { id, diff, pct };
    if (diff <= -MIN_AMOUNT && pct <= -0.15 && (!down || diff < down.diff)) down = { id, diff, pct };
  }
  if (up) {
    out.push({
      id: 'category-up',
      tone: 'negative',
      icon: 'arrow-up-outline',
      text: `Pengeluaran ${labelOf(up.id).toLowerCase()} naik ${percent(up.pct)} dibanding ${vs}.`,
    });
  }

  // 3. Kebiasaan yang berulang (catatan yang sama muncul berkali-kali)
  const notes = new Map<string, { label: string; count: number; sum: number }>();
  const s = cur[0].getTime();
  const e = cur[1].getTime();
  for (const t of txs) {
    if (t.type !== 'expense' || !t.note.trim()) continue;
    const ts = Date.parse(t.date);
    if (ts < s || ts >= e) continue;
    const key = t.note.trim().toLowerCase();
    const rec = notes.get(key) ?? { label: t.note.trim(), count: 0, sum: 0 };
    rec.count += 1;
    rec.sum += t.amount;
    notes.set(key, rec);
  }
  const habit = [...notes.values()].sort((a, b) => b.count - a.count)[0];
  if (habit && habit.count >= 4) {
    out.push({
      id: 'habit',
      tone: 'neutral',
      icon: 'repeat-outline',
      text: `${habit.label} tercatat ${habit.count} kali ${isCurrent ? 'bulan ini' : `di ${BULAN[ym.m]}`}, total ${rupiah(habit.sum)}.`,
    });
  }

  // 4. Kategori terbesar minggu ini
  if (isCurrent) {
    const week = expenseByCategory(txs, startOfWeek(now), addDays(startOfDay(now), 1));
    const ranked = [...week.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked.length >= 2) {
      out.push({
        id: 'week-top',
        tone: 'neutral',
        icon: 'calendar-outline',
        text: `${labelOf(ranked[0][0])} jadi pengeluaran terbesar minggu ini (${rupiah(ranked[0][1])}).`,
      });
    }
  }

  // 5. Total dibanding periode pembanding
  if (prevTotals.expense > 0 && curTotals.expense > 0) {
    const change = (curTotals.expense - prevTotals.expense) / prevTotals.expense;
    if (change <= -0.05) {
      out.push({
        id: 'total-down',
        tone: 'positive',
        icon: 'arrow-down-outline',
        text: `Total pengeluaran ${percent(-change)} lebih rendah dibanding ${vs}.`,
      });
    }
  }

  // 6. Kategori yang turun (kabar baik)
  if (down) {
    out.push({
      id: 'category-down',
      tone: 'positive',
      icon: 'arrow-down-outline',
      text: `Pengeluaran ${labelOf(down.id).toLowerCase()} turun ${percent(-down.pct)} dibanding ${vs}.`,
    });
  }

  // 7. Hari tanpa pengeluaran
  const daily = dailyExpense(txs, ym);
  const upto = isCurrent ? now.getDate() : daily.length;
  const zeroDays = daily.slice(0, upto).filter((v) => v === 0).length;
  if (zeroDays > 0 && zeroDays < upto) {
    out.push({
      id: 'no-spend',
      tone: 'positive',
      icon: 'leaf-outline',
      text: `Ada ${zeroDays} hari tanpa pengeluaran ${isCurrent ? 'bulan ini' : `di ${BULAN[ym.m]}`}.`,
    });
  }

  return out.slice(0, 4);
}
