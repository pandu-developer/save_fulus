// Util untuk format & parsing angka Rupiah

// 12345 -> "Rp12.345"
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${digits}`;
}

// 12345 -> "12.345" (tanpa "Rp")
export function formatAngka(amount: number): string {
  return Math.round(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// "Rp12.345" / "12.345" -> 12345
export function parseAngka(text: string): number {
  const digits = text.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// Untuk input: normalisasi teks ketikan menjadi "12.345"
export function formatInputAngka(text: string): string {
  const digits = text.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
