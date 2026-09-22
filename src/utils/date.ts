// Util tanggal berbahasa Indonesia (tanpa dependency eksternal)

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// "2026-09-22T..." -> "22 Sep 2026"
export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}`;
}

// -> "Senin, 22 September 2026"
export function formatTanggalPanjang(iso: string): string {
  const d = new Date(iso);
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function namaBulan(monthIndex: number): string {
  return BULAN[monthIndex] ?? '';
}

export function namaBulanSingkat(monthIndex: number): string {
  return BULAN_SINGKAT[monthIndex] ?? '';
}

// Kunci per-hari (berdasarkan waktu lokal) untuk pengelompokan
export function dateKey(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// "Hari ini" / "Kemarin" / "Senin, 22 September 2026"
export function labelTanggalRelatif(iso: string): string {
  const key = dateKey(iso);
  const now = new Date();
  const kemarin = new Date();
  kemarin.setDate(now.getDate() - 1);
  if (key === dateKey(now.toISOString())) return 'Hari ini';
  if (key === dateKey(kemarin.toISOString())) return 'Kemarin';
  return formatTanggalPanjang(iso);
}

export function isSameMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
}

// Sapaan sesuai jam
export function salamWaktu(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}
