# Pencatat Uang

Pencatat keuangan pribadi berbasis **React Native (Expo SDK 57)** + **TypeScript** + **Expo Router**. Dibuat untuk mencatat pemasukan & pengeluaran dengan cepat, mengatur budget bulanan, dan melihat kebiasaan belanja. Data disimpan **lokal di HP** — tanpa akun, tanpa server.

## Fitur

- **Beranda** — saldo sebagai angka utama, pemasukan & pengeluaran bulan ini, progres budget (dengan penanda "hari ini"), transaksi terbaru. Tombol mata untuk menyembunyikan nominal.
- **Tambah transaksi** — keypad khusus Rupiah (ada tombol `000`), kategori terurut dari yang paling sering dipakai, catatan, tanggal (pilihan cepat + kalender), metode pembayaran (mengingat pilihan terakhir). Setelah simpan muncul snackbar dengan **Urungkan**.
- **Transaksi** — jurnal per hari dengan total harian, pencarian (catatan, kategori, metode, atau nominal), filter periode/kategori/jenis.
- **Budget** — budget bulanan total + per kategori dengan status **Aman / Mendekati batas / Melebihi budget**, daftar pengeluaran yang belum dianggarkan, dan **Impian** (target tabungan dengan perkiraan waktu tercapai).
- **Statistik** — total pengeluaran vs periode yang sama bulan lalu, rata-rata harian, sorotan berbasis data, grafik laju kumulatif, per minggu, dan per kategori.
- **Profil** — nama, saldo awal, target budget, kelola kategori & metode pembayaran, tema (Sistem/Terang/Gelap), sembunyikan nominal, pengingat harian, ekspor CSV, backup & pulihkan (JSON), data contoh.

## Menjalankan

Prasyarat: Node.js dan aplikasi **Expo Go** di HP ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)).

```bash
npm install
```

```bash
npm start
```

Scan QR code dengan Expo Go (Android) atau Kamera (iOS). HP dan komputer harus di Wi‑Fi yang sama. Belum punya data? Ketuk **Coba dengan data contoh** di Beranda.

Pratinjau cepat di browser: `npm run web`. Pemeriksaan kode: `npx tsc --noEmit` dan `npm run lint`.

## Struktur

```
src/
  app/                    # Rute Expo Router (setiap file = layar)
    _layout.tsx           # Root: font, data, tema, toast, stack
    (tabs)/               # Beranda, Transaksi, Budget, Statistik, Profil
    tambah.tsx            # Tambah/ubah transaksi (modal)
    kategori*.tsx, metode.tsx, impian/
  components/             # Komponen domain (baris transaksi, keypad, sheet, chart)
    ui/                   # Primitif: Txt, Button, Chip, Sheet, Toast, Meter, dll.
  data/                   # Tipe, store + persistensi, selector, insight, data contoh, backup
  lib/                    # Format Rupiah & tanggal Indonesia, haptics, file, pengingat
  theme/                  # Token warna (terang/gelap), tipografi, spacing
```

## Catatan desain

- Satu keluarga font (**Plus Jakarta Sans**), tiga bobot, enam ukuran.
- Palet tenang: off-white hangat & charcoal, satu aksen indigo. Merah hanya untuk kondisi berlebih/error, hijau hanya untuk pemasukan/kondisi positif. Kontras teks dicek ≥ 4,5:1 di kedua mode.
- Minim kartu & bayangan: bagian datar, garis pemisah tipis, daftar.

## Data & privasi

Semua data tersimpan di perangkat ini (AsyncStorage). Menghapus aplikasi = menghapus data, jadi buat **backup** berkala lewat Profil. Data dari versi sebelumnya otomatis terbaca.

# save_fulus
