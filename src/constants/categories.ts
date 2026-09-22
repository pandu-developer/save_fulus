import { Category, TransactionType } from '../types';

// Daftar kategori bawaan. `icon` memakai nama Ionicons.
export const CATEGORIES: Category[] = [
  // ---- Pemasukan ----
  { id: 'gaji', label: 'Gaji', icon: 'cash-outline', color: '#16A34A', type: 'income' },
  { id: 'bonus', label: 'Bonus', icon: 'trophy-outline', color: '#F59E0B', type: 'income' },
  { id: 'hadiah', label: 'Hadiah', icon: 'gift-outline', color: '#EC4899', type: 'income' },
  { id: 'investasi', label: 'Investasi', icon: 'trending-up-outline', color: '#0EA5E9', type: 'income' },
  { id: 'penjualan', label: 'Penjualan', icon: 'pricetag-outline', color: '#8B5CF6', type: 'income' },
  { id: 'lain_masuk', label: 'Lainnya', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B', type: 'income' },

  // ---- Pengeluaran ----
  { id: 'makanan', label: 'Makanan', icon: 'fast-food-outline', color: '#F97316', type: 'expense' },
  { id: 'transportasi', label: 'Transportasi', icon: 'bus-outline', color: '#3B82F6', type: 'expense' },
  { id: 'belanja', label: 'Belanja', icon: 'cart-outline', color: '#EC4899', type: 'expense' },
  { id: 'tagihan', label: 'Tagihan', icon: 'receipt-outline', color: '#EF4444', type: 'expense' },
  { id: 'hiburan', label: 'Hiburan', icon: 'game-controller-outline', color: '#8B5CF6', type: 'expense' },
  { id: 'kesehatan', label: 'Kesehatan', icon: 'medkit-outline', color: '#14B8A6', type: 'expense' },
  { id: 'pendidikan', label: 'Pendidikan', icon: 'school-outline', color: '#6366F1', type: 'expense' },
  { id: 'rumah', label: 'Rumah', icon: 'home-outline', color: '#A855F7', type: 'expense' },
  { id: 'lain_keluar', label: 'Lainnya', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B', type: 'expense' },
];

const BY_ID: Record<string, Category> = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c;
  return acc;
}, {} as Record<string, Category>);

export function getCategoryById(id: string): Category | undefined {
  return BY_ID[id];
}

export function getCategoriesByType(type: TransactionType): Category[] {
  return CATEGORIES.filter((c) => c.type === type);
}
