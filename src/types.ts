// Tipe data inti aplikasi pencatat uang

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType; // pemasukan | pengeluaran
  amount: number; // selalu positif, tanda ditentukan oleh `type`
  categoryId: string;
  note: string;
  date: string; // ISO string tanggal transaksi
  createdAt: string; // ISO string kapan dibuat
}

export interface Category {
  id: string;
  label: string;
  icon: string; // nama ikon Ionicons
  color: string; // warna hex 6 digit
  type: TransactionType;
}

// ---- Fitur Impian (menabung untuk barang yang ingin dibeli) ----

export interface SavingsEntry {
  id: string;
  amount: number; // positif = menabung, negatif = koreksi/tarik
  date: string; // ISO string
}

export interface SavingsGoal {
  id: string;
  name: string; // nama impian, mis. "iPhone 15"
  targetAmount: number; // harga / target yang ingin dikumpulkan
  icon: string; // nama ikon Ionicons
  color: string; // warna hex 6 digit
  note?: string;
  entries: SavingsEntry[]; // riwayat menabung
  createdAt: string;
}
