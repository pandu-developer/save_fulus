import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddButton } from '@/components/AddButton';
import { OptionSheet } from '@/components/OptionSheet';
import { ROW_INSET, TransactionRow } from '@/components/TransactionRow';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/Headers';
import { Txt } from '@/components/ui/Txt';
import { categoryOf, monthsWithData, useCategories, useCategoryMap, useMethodMap } from '@/data/selectors';
import { useStore } from '@/data/store';
import type { Transaction, TxType } from '@/data/types';
import {
  currentMonth,
  dayKey,
  formatDayHeader,
  formatMonth,
  monthEnd,
  monthKey,
  monthStart,
  parseMonthKey,
} from '@/lib/date';
import { MINUS, groupDigits, onlyDigits, rupiah } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter, radius } from '@/theme/tokens';

interface DaySection {
  key: string;
  title: string;
  spent: number;
  earned: number;
  data: Transaction[];
}

type TypeFilter = 'all' | TxType;
const ALL = 'all';

export default function Transaksi() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ kategori?: string; bulan?: string }>();
  const txs = useStore((s) => s.transactions);
  const categories = useCategories();
  const catMap = useCategoryMap();
  const methodMap = useMethodMap();

  const thisMonthKey = monthKey(currentMonth());
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<string>(thisMonthKey);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sheet, setSheet] = useState<'period' | 'category' | 'type' | null>(null);
  const [searching, setSearching] = useState(false);

  // Filter yang dikirim dari layar lain (mis. ketuk kategori di Statistik) — diterapkan sekali per perubahan.
  const paramSig = `${params.kategori ?? ''}|${params.bulan ?? ''}`;
  const [appliedSig, setAppliedSig] = useState('|');
  if (paramSig !== appliedSig) {
    setAppliedSig(paramSig);
    if (paramSig !== '|') {
      if (params.kategori) setCategoryId(params.kategori);
      if (params.bulan && parseMonthKey(params.bulan)) setPeriod(params.bulan);
      setTypeFilter('all');
      setQuery('');
    }
  }

  const { sections, count, spent, earned } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = onlyDigits(q);
    const ym = period === ALL ? null : parseMonthKey(period);
    const s = ym ? monthStart(ym).getTime() : -Infinity;
    const e = ym ? monthEnd(ym).getTime() : Infinity;
    const groups = new Map<string, DaySection>();
    let total = 0;
    let out = 0;
    let inn = 0;
    for (const t of txs) {
      const ts = Date.parse(t.date);
      if (ts < s || ts >= e) continue;
      if (typeFilter !== 'all' && t.type !== typeFilter) continue;
      if (categoryId && t.categoryId !== categoryId) continue;
      if (q) {
        const cat = catMap.get(t.categoryId)?.label ?? '';
        const method = t.methodId ? methodMap.get(t.methodId)?.label ?? '' : '';
        const hay = `${t.note} ${cat} ${method}`.toLowerCase();
        const amountHit = qDigits.length >= 3 && String(t.amount).includes(qDigits);
        if (!hay.includes(q) && !amountHit) continue;
      }
      const d = new Date(ts);
      const key = dayKey(d);
      let g = groups.get(key);
      if (!g) {
        g = { key, title: formatDayHeader(d), spent: 0, earned: 0, data: [] };
        groups.set(key, g);
      }
      g.data.push(t);
      if (t.type === 'income') {
        g.earned += t.amount;
        inn += t.amount;
      } else {
        g.spent += t.amount;
        out += t.amount;
      }
      total += 1;
    }
    // txs sudah terurut terbaru dulu, jadi urutan grup juga.
    return { sections: [...groups.values()], count: total, spent: out, earned: inn };
  }, [txs, query, period, categoryId, typeFilter, catMap, methodMap]);

  const months = useMemo(() => {
    const list = monthsWithData(txs);
    const cm = currentMonth();
    if (!list.some((x) => x.y === cm.y && x.m === cm.m)) list.unshift(cm);
    return list;
  }, [txs]);

  const openTx = useCallback(
    (tx: Transaction) => router.push({ pathname: '/tambah', params: { id: tx.id } }),
    [router],
  );

  const periodYm = period === ALL ? null : parseMonthKey(period);
  const periodLabel = periodYm ? formatMonth(periodYm) : 'Semua waktu';
  const categoryLabel = categoryId ? (catMap.get(categoryId)?.label ?? 'Kategori') : 'Semua kategori';
  const typeLabel = typeFilter === 'income' ? 'Pemasukan' : typeFilter === 'expense' ? 'Pengeluaran' : 'Semua jenis';
  const filtered = !!query.trim() || !!categoryId || typeFilter !== 'all' || period !== thisMonthKey;

  const resetFilters = () => {
    setQuery('');
    setCategoryId(null);
    setTypeFilter('all');
    setPeriod(thisMonthKey);
  };

  const empty = (() => {
    if (txs.length === 0) {
      return (
        <EmptyState
          icon="list-outline"
          title="Belum ada transaksi."
          body="Semua catatanmu akan tersusun di sini per hari, seperti buku kas."
          action={{ label: 'Catat transaksi', onPress: () => router.push('/tambah') }}
        />
      );
    }
    if (query.trim()) {
      return (
        <EmptyState
          icon="search-outline"
          title={`Tidak ada yang cocok dengan “${query.trim()}”${periodYm ? ` di ${formatMonth(periodYm)}` : ''}.`}
          body="Coba kata lain, sebagian nominal (mis. 35000), atau cari di semua waktu."
          action={periodYm ? { label: 'Cari di semua waktu', onPress: () => setPeriod(ALL) } : undefined}
          secondary={{ label: 'Hapus filter', onPress: resetFilters }}
        />
      );
    }
    return (
      <EmptyState
        icon="calendar-outline"
        title={periodYm ? `Belum ada transaksi di ${formatMonth(periodYm)}.` : 'Tidak ada transaksi untuk filter ini.'}
        body={filtered ? 'Filter yang aktif mungkin terlalu sempit.' : 'Transaksi yang kamu catat bulan ini akan muncul di sini.'}
        action={filtered ? { label: 'Hapus filter', onPress: resetFilters } : undefined}
      />
    );
  })();

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Transaksi" />

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: c.panel }]}>
          <Ionicons name="search-outline" size={18} color={c.ink3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Cari catatan, kategori, atau nominal"
            placeholderTextColor={c.ink3}
            returnKeyType="search"
            onFocus={() => setSearching(true)}
            onBlur={() => setSearching(false)}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Cari transaksi"
            style={[styles.searchInput, { color: c.ink }]}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Kosongkan pencarian" hitSlop={10} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.ink3} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterBar}
      >
        <Chip
          label={periodLabel}
          trailingIcon="chevron-down"
          active={period !== thisMonthKey}
          onPress={() => setSheet('period')}
          accessibilityLabel={`Periode: ${periodLabel}`}
        />
        <Chip
          label={categoryLabel}
          trailingIcon="chevron-down"
          active={!!categoryId}
          onPress={() => setSheet('category')}
          accessibilityLabel={`Kategori: ${categoryLabel}`}
        />
        <Chip
          label={typeLabel}
          trailingIcon="chevron-down"
          active={typeFilter !== 'all'}
          onPress={() => setSheet('type')}
          accessibilityLabel={`Jenis: ${typeLabel}`}
        />
        {filtered ? <Chip label="Reset" icon="refresh-outline" onPress={resetFilters} /> : null}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(t) => t.id}
        stickySectionHeadersEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          count > 0 ? (
            <Txt variant="label" tone="ink2" style={styles.summary} tabular>
              {count} transaksi · keluar {rupiah(spent)} · masuk {rupiah(earned)}
            </Txt>
          ) : null
        }
        ListEmptyComponent={empty}
        renderSectionHeader={({ section }) => (
          <View style={[styles.dayHeader, { backgroundColor: c.bg }]}>
            <Txt variant="label" weight="semibold" style={styles.flex}>
              {section.title}
            </Txt>
            {section.spent > 0 ? (
              <Txt variant="label" tone="ink2" tabular>
                {MINUS}Rp{groupDigits(section.spent)}
              </Txt>
            ) : (
              <Txt variant="label" tone="positive" tabular>
                +Rp{groupDigits(section.earned)}
              </Txt>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <TransactionRow
            tx={item}
            category={categoryOf(catMap, item)}
            method={item.methodId ? methodMap.get(item.methodId) : undefined}
            onPress={openTx}
          />
        )}
        ItemSeparatorComponent={() => <Divider inset={ROW_INSET} />}
      />

      {searching ? null : <AddButton onPress={() => router.push('/tambah')} />}

      <OptionSheet
        visible={sheet === 'period'}
        title="Periode"
        selectedId={period}
        options={[
          { id: ALL, label: 'Semua waktu', icon: 'infinite-outline' },
          ...months.map((ym) => ({ id: monthKey(ym), label: formatMonth(ym), icon: 'calendar-outline' as const })),
        ]}
        onSelect={(id) => {
          setPeriod(id);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'category'}
        title="Kategori"
        selectedId={categoryId ?? ALL}
        options={[
          { id: ALL, label: 'Semua kategori', icon: 'apps-outline' },
          ...categories.map((cat) => ({
            id: cat.id,
            label: cat.label,
            icon: cat.icon,
            description: cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          })),
        ]}
        onSelect={(id) => {
          setCategoryId(id === ALL ? null : id);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <OptionSheet
        visible={sheet === 'type'}
        title="Jenis"
        selectedId={typeFilter}
        options={[
          { id: 'all', label: 'Semua jenis', icon: 'swap-vertical-outline' },
          { id: 'expense', label: 'Pengeluaran', icon: 'arrow-up-outline' },
          { id: 'income', label: 'Pemasukan', icon: 'arrow-down-outline' },
        ]}
        onSelect={(id) => {
          setTypeFilter(id as TypeFilter);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: { paddingHorizontal: gutter, paddingTop: 4 },
  search: {
    height: 44,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, height: '100%', fontFamily: font.regular, fontSize: 15 },
  // Tinggi eksplisit: ScrollView horizontal tidak selalu mengukur tinggi kontennya (mis. di web).
  filterBar: { flexGrow: 0, flexShrink: 0, height: 60 },
  filters: { paddingHorizontal: gutter, paddingVertical: 12, gap: 8 },
  list: { paddingBottom: 112, flexGrow: 1 },
  summary: { paddingHorizontal: gutter, paddingBottom: 4 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter,
    paddingTop: 18,
    paddingBottom: 6,
  },
});
