// Util tanggal Bahasa Indonesia — tanpa dependency, semua dalam waktu lokal.

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
export const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export interface YearMonth {
  y: number;
  m: number; // 0-11
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Senin sebagai awal minggu (kebiasaan di Indonesia). */
export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7;
  return addDays(day, -offset);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

export function monthStart({ y, m }: YearMonth): Date {
  return new Date(y, m, 1);
}

/** Awal bulan berikutnya (batas eksklusif). */
export function monthEnd({ y, m }: YearMonth): Date {
  return new Date(y, m + 1, 1);
}

export function shiftMonth({ y, m }: YearMonth, delta: number): YearMonth {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

export function currentMonth(now = new Date()): YearMonth {
  return { y: now.getFullYear(), m: now.getMonth() };
}

export function sameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.y === b.y && a.m === b.m;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Kunci per hari lokal: "2026-09-25" */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Kunci bulan: "2026-09" */
export function monthKey({ y, m }: YearMonth): string {
  return `${y}-${pad(m + 1)}`;
}

export function parseMonthKey(key: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const m = Number(match[2]) - 1;
  return m >= 0 && m < 12 ? { y: Number(match[1]), m } : null;
}

/** "19.42" — pemisah jam memakai titik sesuai EYD. */
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}.${pad(d.getMinutes())}`;
}

/** "September 2026" */
export function formatMonth({ y, m }: YearMonth): string {
  return `${BULAN[m]} ${y}`;
}

/** "25 Sep" */
export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]}`;
}

/** "25 September 2026" */
export function formatDateMedium(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Kamis, 25 September 2026" */
export function formatDateLong(d: Date): string {
  return `${HARI[d.getDay()]}, ${formatDateMedium(d)}`;
}

/** Judul grup di jurnal: "Hari ini" / "Kemarin" / "Selasa, 23 September" */
export function formatDayHeader(d: Date, now = new Date()): string {
  if (isSameDay(d, now)) return 'Hari ini';
  if (isSameDay(d, addDays(now, -1))) return 'Kemarin';
  const base = `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** Label singkat relatif untuk form: "Hari ini", "Kemarin", atau "Sel, 23 Sep" */
export function formatRelativeShort(d: Date, now = new Date()): string {
  if (isSameDay(d, now)) return 'Hari ini';
  if (isSameDay(d, addDays(now, -1))) return 'Kemarin';
  const base = `${HARI_SINGKAT[d.getDay()]}, ${formatDateShort(d)}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h >= 4 && h < 11) return 'Selamat pagi';
  if (h >= 11 && h < 15) return 'Selamat siang';
  if (h >= 15 && h < 18) return 'Selamat sore';
  return 'Selamat malam';
}
