# 💰 Pencatat Uang

Aplikasi pencatat keuangan pribadi (pemasukan & pengeluaran) berbasis **React Native (Expo)** + **TypeScript**. Data disimpan **lokal di HP** (AsyncStorage), tanpa internet, tanpa akun.

## ✨ Fitur

- **Beranda** — total saldo, ringkasan pemasukan & pengeluaran bulan ini, dan transaksi terbaru.
- **Tambah / Edit Transaksi** — pilih jenis (pemasukan/pengeluaran), nominal berformat Rupiah, 15 kategori berikon, tanggal, dan catatan.
- **Transaksi** — daftar lengkap dikelompokkan per tanggal (Hari ini / Kemarin / tanggal), dengan filter dan saldo harian.
- **Laporan** — ringkasan per bulan (bisa geser bulan) + rincian per kategori dengan bar persentase.
- **🎯 Impian** — daftar barang yang ingin dibeli: tentukan nama, ikon, warna, dan target harga, lalu menabung sedikit demi sedikit (ada tombol nabung cepat + riwayat tabungan). Progres tiap impian tampil dengan bar & persentase.
- **🌙 Mode gelap** — toggle terang/gelap di kanan atas Beranda; mengikuti sistem secara default, dan pilihannya tersimpan.
- Hapus transaksi/impian lewat halaman edit.

## 🚀 Cara Menjalankan

**Prasyarat:** [Node.js](https://nodejs.org) (sudah ada) dan aplikasi **Expo Go** di HP-mu ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).

1. Pasang dependency (sekali saja):
   ```bash
   npm install
   ```
2. Jalankan server pengembangan:
   ```bash
   npm start
   ```
3. Akan muncul **QR code** di terminal:
   - **Android:** buka aplikasi Expo Go → "Scan QR code".
   - **iOS:** buka **Kamera** bawaan → arahkan ke QR → ketuk notifikasi.

   Pastikan HP dan komputer berada di **jaringan Wi‑Fi yang sama**.

Ingin pakai emulator? `npm run android` (Android Studio) atau `npm run ios` (khusus macOS).

## 🗂️ Struktur Proyek

```
App.tsx                     # Navigasi utama (tab + modal tambah)
src/
  types.ts                  # Tipe data Transaction & Category
  theme.ts                  # Warna, spacing, radius, bayangan
  constants/categories.ts   # Daftar kategori + ikon + warna
  utils/format.ts           # Format & parsing Rupiah
  utils/date.ts             # Format tanggal Bahasa Indonesia
  storage/storage.ts        # Baca/tulis AsyncStorage
  context/                  # State transaksi (Context + hooks)
  navigation/types.ts       # Tipe navigasi
  components/                # Item transaksi, FAB, empty state, dll.
  screens/                  # Beranda, Transaksi, Laporan, Tambah/Edit
```

## 📝 Catatan

- Semua data tersimpan **hanya di perangkat ini**. Menghapus aplikasi = menghapus data. (Bisa dikembangkan ke backup cloud nanti.)
- Mata uang: Rupiah (Rp), format Indonesia.
# save_fulus
