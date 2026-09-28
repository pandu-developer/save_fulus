import { addDays, monthStart, shiftMonth, startOfDay } from '@/lib/date';
import { DEFAULT_SETTINGS } from './defaults';
import { expenseByCategory } from './selectors';
import { uid } from './store';
import type { Budgets, Goal, Settings, Snapshot, Transaction, TxType } from './types';

// PRNG deterministik (mulberry32) — data contoh sama setiap kali dibuat di bulan yang sama.
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];
const chance = (rng: Rng, p: number) => rng() < p;

interface Draft {
  type: TxType;
  amount: number;
  categoryId: string;
  methodId: string;
  note: string;
  at: Date;
}

function at(day: Date, hour: number, minute: number): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Menit acak dalam rentang jam, dibulatkan ke 5 menit
function timeIn(rng: Rng, day: Date, fromHour: number, toHour: number): Date {
  const minutes = fromHour * 60 + Math.floor(rng() * (toHour - fromHour) * 12) * 5;
  return at(day, Math.floor(minutes / 60), minutes % 60);
}

function generateDay(rng: Rng, day: Date, out: Draft[]) {
  const dow = day.getDay();
  const weekday = dow >= 1 && dow <= 5;
  const date = day.getDate();
  const add = (d: Omit<Draft, 'type'> & { type?: TxType }) => out.push({ type: 'expense', ...d });

  // Sarapan
  if (chance(rng, weekday ? 0.55 : 0.3)) {
    add({
      amount: pick(rng, [10000, 12000, 15000, 15000, 18000]),
      categoryId: 'makanan',
      methodId: chance(rng, 0.7) ? 'tunai' : 'qris',
      note: pick(rng, ['Nasi uduk', 'Bubur ayam', 'Lontong sayur', 'Roti bakar']),
      at: timeIn(rng, day, 6, 8),
    });
  }
  // Berangkat kerja
  if (weekday && chance(rng, 0.85)) {
    const grab = chance(rng, 0.45);
    add({
      amount: pick(rng, [14000, 15000, 16500, 18000, 21000, 23500]),
      categoryId: 'transportasi',
      methodId: grab ? 'ovo' : 'gopay',
      note: grab ? 'Grab' : 'Gojek',
      at: timeIn(rng, day, 7, 9),
    });
  }
  // Makan siang
  if (chance(rng, weekday ? 0.92 : 0.7)) {
    const gofood = chance(rng, 0.12);
    add({
      amount: gofood
        ? pick(rng, [42000, 48500, 55000, 61000])
        : pick(rng, [18000, 20000, 22000, 25000, 25000, 28000, 32000, 35000]),
      categoryId: 'makanan',
      methodId: gofood ? 'gopay' : chance(rng, 0.65) ? 'qris' : 'tunai',
      note: gofood
        ? 'GoFood'
        : pick(rng, ['Makan siang', 'Makan siang', 'Nasi padang', 'Warteg', 'Mie ayam', 'Ayam geprek', 'Gado-gado']),
      at: timeIn(rng, day, 11, 13),
    });
  }
  // Kopi sore
  if (chance(rng, weekday ? 0.42 : 0.3)) {
    const kopi = chance(rng, 0.75);
    add({
      amount: kopi ? pick(rng, [18000, 20000, 22000, 24000, 25000]) : 8000,
      categoryId: 'makanan',
      methodId: 'qris',
      note: kopi ? 'Kopi' : 'Es teh',
      at: timeIn(rng, day, 14, 17),
    });
  }
  // Pulang kerja
  if (weekday && chance(rng, 0.7)) {
    const grab = chance(rng, 0.45);
    add({
      amount: pick(rng, [15000, 17000, 19500, 22000, 26000]),
      categoryId: 'transportasi',
      methodId: grab ? 'ovo' : 'gopay',
      note: grab ? 'Grab' : 'Gojek',
      at: timeIn(rng, day, 17, 19),
    });
  }
  // Makan malam
  if (chance(rng, 0.62)) {
    add({
      amount: pick(rng, [20000, 23000, 25000, 30000, 35000, 38000]),
      categoryId: 'makanan',
      methodId: chance(rng, 0.55) ? 'tunai' : 'qris',
      note: pick(rng, ['Makan malam', 'Pecel lele', 'Nasi goreng', 'Sate ayam', 'Martabak']),
      at: timeIn(rng, day, 18, 21),
    });
  }
  // Belanja mingguan
  if (dow === 6 && chance(rng, 0.85)) {
    add({
      amount: pick(rng, [67500, 84000, 112500, 139000, 185000]),
      categoryId: 'belanja',
      methodId: chance(rng, 0.5) ? 'debit' : 'qris',
      note: pick(rng, ['Indomaret', 'Alfamart', 'Superindo']),
      at: timeIn(rng, day, 10, 17),
    });
  }
  // Bensin tiap ± 5 hari
  if (date % 5 === 2) {
    add({ amount: 50000, categoryId: 'transportasi', methodId: 'tunai', note: 'Bensin', at: timeIn(rng, day, 7, 9) });
  }
  // Hiburan akhir pekan
  if ((dow === 6 || dow === 0) && chance(rng, 0.28)) {
    const bioskop = chance(rng, 0.5);
    add({
      amount: bioskop ? pick(rng, [50000, 60000, 100000]) : pick(rng, [85000, 110000, 135000]),
      categoryId: 'hiburan',
      methodId: 'qris',
      note: bioskop ? 'Bioskop' : 'Nongkrong',
      at: timeIn(rng, day, 18, 21),
    });
  }
  // Belanja online sesekali
  if (chance(rng, 0.06)) {
    add({
      amount: pick(rng, [89000, 125000, 159000, 212000, 279000]),
      categoryId: 'belanja',
      methodId: chance(rng, 0.5) ? 'kredit' : 'dana',
      note: pick(rng, ['Shopee', 'Tokopedia']),
      at: timeIn(rng, day, 20, 23),
    });
  }

  // Tagihan rutin
  const bills: [number, number, string, string, string, number][] = [
    // tanggal, nominal, kategori, metode, catatan, jam
    [1, 350000, 'tagihan', 'transfer', 'Internet rumah', 9],
    [3, 200000, 'tagihan', 'gopay', 'Token listrik', 19],
    [5, 100000, 'tagihan', 'dana', 'Paket data', 12],
    [10, 150000, 'kesehatan', 'transfer', 'BPJS Kesehatan', 10],
    [12, 54000, 'hiburan', 'kredit', 'Netflix', 8],
    [15, 55000, 'hiburan', 'kredit', 'Spotify', 8],
    [18, 35000, 'lain_keluar', 'tunai', 'Potong rambut', 16],
    [20, 149000, 'pendidikan', 'kredit', 'Kursus online', 20],
  ];
  for (const [d, amount, categoryId, methodId, note, hour] of bills) {
    if (date === d) add({ amount, categoryId, methodId, note, at: at(day, hour, 5 * Math.floor(rng() * 11)) });
  }
  if (date === 22 && chance(rng, 0.5)) {
    add({ amount: 45000, categoryId: 'kesehatan', methodId: 'qris', note: 'Apotek', at: timeIn(rng, day, 16, 20) });
  }
  if (date === 14 && chance(rng, 0.6)) {
    add({ amount: 100000, categoryId: 'lain_keluar', methodId: 'tunai', note: 'Kondangan', at: at(day, 11, 30) });
  }

  // Gajian tanggal 25
  if (date === 25) {
    out.push({
      type: 'income',
      amount: 4750000,
      categoryId: 'gaji',
      methodId: 'transfer',
      note: 'Gaji',
      at: at(day, 9, 0),
    });
  }
}

// Bulatkan batas budget ke angka yang wajar (Rp10.000 / Rp50.000)
function roundBudget(x: number, direction: 'up' | 'down'): number {
  const step = x < 500000 ? 10000 : 50000;
  const f = direction === 'up' ? Math.ceil : Math.floor;
  return Math.max(step, f(x / step) * step);
}

/** Data contoh 2 bulan terakhir + bulan berjalan, sampai detik ini. */
export function buildSampleData(now: Date, keep: Pick<Settings, 'name' | 'themeMode'>): Snapshot {
  const thisMonth = { y: now.getFullYear(), m: now.getMonth() };
  const start = monthStart(shiftMonth(thisMonth, -2));
  const rng = createRng(thisMonth.y * 100 + thisMonth.m + 7);

  const drafts: Draft[] = [];
  for (let day = start; day <= now; day = addDays(day, 1)) {
    generateDay(rng, startOfDay(day), drafts);
  }
  // Satu pemasukan tambahan bulan lalu
  const lastMonth = shiftMonth(thisMonth, -1);
  drafts.push({
    type: 'income',
    amount: 750000,
    categoryId: 'lain_masuk',
    methodId: 'transfer',
    note: 'Proyek freelance',
    at: new Date(lastMonth.y, lastMonth.m, 14, 16, 20),
  });

  const transactions: Transaction[] = drafts
    .filter((d) => d.at.getTime() <= now.getTime())
    .map((d) => ({
      id: uid(),
      type: d.type,
      amount: d.amount,
      categoryId: d.categoryId,
      methodId: d.methodId,
      note: d.note,
      date: d.at.toISOString(),
      createdAt: d.at.toISOString(),
    }));

  // Budget dikalibrasi dari pengeluaran bulan ini supaya ketiga status terlihat.
  const spent = expenseByCategory(transactions, monthStart(thisMonth), addDays(startOfDay(now), 1));
  const target: [string, number, 'up' | 'down'][] = [
    ['makanan', 0.86, 'up'], // mendekati batas
    ['transportasi', 0.58, 'up'], // aman
    ['belanja', 0.62, 'up'], // aman
    ['tagihan', 0.72, 'up'], // aman
    ['hiburan', 1.12, 'down'], // melebihi
  ];
  const budgets: Budgets = {};
  for (const [id, ratio, dir] of target) {
    const s = spent.get(id) ?? 0;
    if (s > 0) budgets[id] = roundBudget(s / ratio, dir);
  }
  const allocated = Object.values(budgets).reduce((a, b) => a + b, 0);
  const monthlyBudget = Math.ceil((allocated + 600000) / 100000) * 100000;

  const monthAgo = (m: number, day: number, hour = 20) => {
    const ym = shiftMonth(thisMonth, -m);
    return new Date(ym.y, ym.m, day, hour, 15).toISOString();
  };
  const goalDrafts: Goal[] = [
    {
      id: uid(),
      name: 'Laptop baru',
      targetAmount: 12000000,
      icon: 'laptop-outline',
      createdAt: monthAgo(2, 1),
      entries: [
        { id: uid(), amount: 2000000, date: monthAgo(2, 1) },
        { id: uid(), amount: 1500000, date: monthAgo(2, 26) },
        { id: uid(), amount: 1000000, date: monthAgo(1, 26) },
      ],
    },
    {
      id: uid(),
      name: 'Dana darurat',
      targetAmount: 15000000,
      icon: 'shield-checkmark-outline',
      createdAt: monthAgo(2, 2),
      entries: [
        { id: uid(), amount: 5000000, date: monthAgo(2, 2) },
        { id: uid(), amount: 500000, date: monthAgo(2, 26) },
        { id: uid(), amount: 500000, date: monthAgo(1, 26) },
      ],
    },
  ];
  const goals = goalDrafts.map((g) => ({
    ...g,
    entries: g.entries.filter((e) => Date.parse(e.date) <= now.getTime()),
  }));

  return {
    transactions,
    customCategories: [],
    customMethods: [],
    budgets,
    goals,
    settings: {
      ...DEFAULT_SETTINGS,
      ...keep,
      initialBalance: 6500000,
      monthlyBudget,
      lastMethod: { expense: 'qris', income: 'transfer' },
    },
  };
}
