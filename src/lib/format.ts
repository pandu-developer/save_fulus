import type { TxType } from '@/data/types';

// Tanda minus tipografis (U+2212) — lebih rapi dari tanda hubung untuk angka.
export const MINUS = '−';
export const MASK = 'Rp••••••';

/** 1250000 -> "1.250.000" */
export function groupDigits(n: number): string {
  return Math.round(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 1250000 -> "Rp1.250.000", -5000 -> "−Rp5.000" */
export function rupiah(n: number): string {
  return `${n < 0 ? MINUS : ''}Rp${groupDigits(n)}`;
}

/** Nominal transaksi bertanda: pemasukan "+Rp…", pengeluaran "−Rp…" */
export function rupiahSigned(amount: number, type: TxType): string {
  return `${type === 'income' ? '+' : MINUS}Rp${groupDigits(amount)}`;
}

function oneDecimal(x: number): string {
  const r = Math.round(x * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
}

/** Ringkas untuk label chart: 350000 -> "350 rb", 1250000 -> "1,3 jt" */
export function compact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? MINUS : '';
  if (a >= 1e9) return `${sign}${oneDecimal(a / 1e9)} M`;
  if (a >= 1e6) return `${sign}${oneDecimal(a / 1e6)} jt`;
  if (a >= 1e3) return `${sign}${Math.round(a / 1e3)} rb`;
  return `${sign}${Math.round(a)}`;
}

/** 0.184 -> "18%", dengan digits=1 -> "18,4%" */
export function percent(ratio: number, digits = 0): string {
  const v = ratio * 100;
  const s = digits > 0 ? v.toFixed(digits).replace('.', ',') : String(Math.round(v));
  return `${s}%`;
}

export function onlyDigits(s: string): string {
  return s.replace(/[^0-9]/g, '');
}
