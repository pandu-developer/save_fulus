import { dayKey, formatTime } from '@/lib/date';
import { toSnapshot } from './store';
import type { Category, PaymentMethod, Snapshot, Transaction } from './types';

const APP_ID = 'pencatat-uang';
const VERSION = 2;

export function backupFilename(ext: 'json' | 'csv', now = new Date()): string {
  return `pencatat-uang-${dayKey(now)}.${ext}`;
}

export function buildBackupJson(snap: Snapshot): string {
  return JSON.stringify({ app: APP_ID, version: VERSION, exportedAt: new Date().toISOString(), data: snap }, null, 2);
}

export class BackupError extends Error {}

/** Membaca file backup. Melempar BackupError dengan pesan yang bisa ditampilkan. */
export function parseBackup(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new BackupError('File ini bukan backup Pencatat Uang (format tidak dikenali).');
  }
  if (typeof raw !== 'object' || raw === null || (raw as { app?: unknown }).app !== APP_ID) {
    throw new BackupError('File ini bukan backup Pencatat Uang.');
  }
  const data = (raw as { data?: unknown }).data;
  if (typeof data !== 'object' || data === null) {
    throw new BackupError('Isi backup kosong atau rusak.');
  }
  return toSnapshot(data as Record<string, unknown>);
}

// Excel berbahasa Indonesia memakai ";" sebagai pemisah kolom (koma = desimal).
const SEP = ';';

function cell(v: string | number): string {
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(
  txs: Transaction[],
  categories: Map<string, Category>,
  methods: Map<string, PaymentMethod>,
): string {
  const header = ['Tanggal', 'Jam', 'Jenis', 'Kategori', 'Catatan', 'Metode', 'Nominal'];
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const d = new Date(t.date);
      return [
        dayKey(d),
        formatTime(d).replace('.', ':'),
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        categories.get(t.categoryId)?.label ?? 'Lainnya',
        t.note,
        t.methodId ? methods.get(t.methodId)?.label ?? '' : '',
        t.type === 'income' ? t.amount : -t.amount,
      ]
        .map(cell)
        .join(SEP);
    });
  // BOM agar Excel membaca UTF-8 dengan benar
  return `﻿${[header.join(SEP), ...rows].join('\r\n')}`;
}
