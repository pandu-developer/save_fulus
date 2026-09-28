import type { Category, IconName, PaymentMethod, Settings, TxType } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran
  { id: 'makanan', label: 'Makanan', icon: 'restaurant-outline', type: 'expense' },
  { id: 'transportasi', label: 'Transportasi', icon: 'bus-outline', type: 'expense' },
  { id: 'belanja', label: 'Belanja', icon: 'bag-handle-outline', type: 'expense' },
  { id: 'tagihan', label: 'Tagihan', icon: 'receipt-outline', type: 'expense' },
  { id: 'hiburan', label: 'Hiburan', icon: 'film-outline', type: 'expense' },
  { id: 'kesehatan', label: 'Kesehatan', icon: 'medkit-outline', type: 'expense' },
  { id: 'pendidikan', label: 'Pendidikan', icon: 'school-outline', type: 'expense' },
  { id: 'lain_keluar', label: 'Lainnya', icon: 'ellipsis-horizontal-outline', type: 'expense' },
  // Pemasukan
  { id: 'gaji', label: 'Gaji', icon: 'briefcase-outline', type: 'income' },
  { id: 'bonus', label: 'Bonus', icon: 'ribbon-outline', type: 'income' },
  { id: 'hadiah', label: 'Hadiah', icon: 'gift-outline', type: 'income' },
  { id: 'investasi', label: 'Investasi', icon: 'trending-up-outline', type: 'income' },
  { id: 'penjualan', label: 'Penjualan', icon: 'storefront-outline', type: 'income' },
  { id: 'lain_masuk', label: 'Lainnya', icon: 'ellipsis-horizontal-outline', type: 'income' },
];

// Ke mana transaksi dipindah saat kategori custom dihapus
export const FALLBACK_CATEGORY: Record<TxType, string> = {
  expense: 'lain_keluar',
  income: 'lain_masuk',
};

// Kategori bawaan versi lama yang tidak lagi jadi default — dipulihkan sebagai
// kategori custom bila masih dipakai transaksi lama.
export const LEGACY_CATEGORIES: Record<string, Omit<Category, 'id'>> = {
  rumah: { label: 'Rumah', icon: 'home-outline', type: 'expense', custom: true },
};

export const DEFAULT_METHODS: PaymentMethod[] = [
  { id: 'tunai', label: 'Tunai', icon: 'cash-outline' },
  { id: 'qris', label: 'QRIS', icon: 'qr-code-outline' },
  { id: 'debit', label: 'Kartu debit', icon: 'card-outline' },
  { id: 'transfer', label: 'Transfer bank', icon: 'swap-horizontal-outline' },
  { id: 'gopay', label: 'GoPay', icon: 'phone-portrait-outline' },
  { id: 'ovo', label: 'OVO', icon: 'phone-portrait-outline' },
  { id: 'dana', label: 'DANA', icon: 'phone-portrait-outline' },
  { id: 'kredit', label: 'Kartu kredit', icon: 'card-outline' },
];

export const CATEGORY_ICON_CHOICES: IconName[] = [
  'cafe-outline',
  'fast-food-outline',
  'cart-outline',
  'shirt-outline',
  'home-outline',
  'flash-outline',
  'water-outline',
  'wifi-outline',
  'phone-portrait-outline',
  'car-outline',
  'airplane-outline',
  'paw-outline',
  'barbell-outline',
  'game-controller-outline',
  'book-outline',
  'people-outline',
  'heart-outline',
  'construct-outline',
  'cash-outline',
  'sparkles-outline',
];

export const METHOD_ICON_CHOICES: IconName[] = [
  'phone-portrait-outline',
  'card-outline',
  'cash-outline',
  'qr-code-outline',
  'swap-horizontal-outline',
  'business-outline',
];

export const GOAL_ICON_CHOICES: IconName[] = [
  'laptop-outline',
  'phone-portrait-outline',
  'car-outline',
  'bicycle-outline',
  'home-outline',
  'airplane-outline',
  'camera-outline',
  'game-controller-outline',
  'watch-outline',
  'school-outline',
  'shield-checkmark-outline',
  'heart-outline',
];

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  initialBalance: 0,
  monthlyBudget: 0,
  hideAmounts: false,
  themeMode: 'system',
  reminderEnabled: false,
  reminderHour: 21,
  reminderMinute: 0,
  lastMethod: {},
};

// Ambang status budget
export const BUDGET_NEAR = 0.8;
