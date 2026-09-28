import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddButton } from '@/components/AddButton';
import { AmountSheet } from '@/components/AmountSheet';
import { StatusLabel } from '@/components/StatusLabel';
import { ROW_INSET, TransactionRow } from '@/components/TransactionRow';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { Meter } from '@/components/ui/Meter';
import { Money } from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { buildSampleData } from '@/data/sample';
import {
  balanceOf,
  budgetStatus,
  categoryOf,
  daysLeftInMonth,
  monthTotals,
  useCategoryMap,
  useMethodMap,
} from '@/data/selectors';
import { replaceAll, updateSettings, useStore } from '@/data/store';
import type { Transaction } from '@/data/types';
import { BULAN, daysInMonth, formatDateLong, formatRelativeShort, greeting, isSameDay } from '@/lib/date';
import { MASK, rupiah } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

export default function Beranda() {
  const { c } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const now = useNow();
  const txs = useStore((s) => s.transactions);
  const settings = useStore((s) => s.settings);
  const catMap = useCategoryMap();
  const methodMap = useMethodMap();
  const [budgetSheet, setBudgetSheet] = useState(false);

  const y = now.getFullYear();
  const m = now.getMonth();
  const totals = useMemo(() => monthTotals(txs, { y, m }), [txs, y, m]);
  const balance = useMemo(() => balanceOf(txs, settings.initialBalance), [txs, settings.initialBalance]);
  const recent = txs.slice(0, 5);
  const masked = settings.hideAmounts;

  const budget = settings.monthlyBudget;
  const spent = totals.expense;
  const remaining = budget - spent;
  const status = budgetStatus(spent, budget);
  const daysLeft = daysLeftInMonth(now);
  const perDay = Math.floor(Math.max(remaining, 0) / daysLeft / 500) * 500;

  const openTx = useCallback(
    (tx: Transaction) => router.push({ pathname: '/tambah', params: { id: tx.id } }),
    [router],
  );

  const loadSample = () => {
    replaceAll(buildSampleData(new Date(), { name: settings.name, themeMode: settings.themeMode }));
    toast({ message: 'Data contoh dimuat. Hapus kapan saja lewat Profil.' });
  };

  let budgetLine: string;
  if (masked) budgetLine = 'Nominal disembunyikan';
  else if (remaining >= 0) budgetLine = `Sisa ${rupiah(remaining)} untuk ${daysLeft} hari — sekitar ${rupiah(perDay)} per hari.`;
  else budgetLine = `Lebih ${rupiah(-remaining)} dari budget bulan ini.`;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Txt variant="label" tone="ink2">
              {formatDateLong(now)}
            </Txt>
            <Txt variant="title" accessibilityRole="header" numberOfLines={2}>
              {greeting(now)}
              {settings.name ? `, ${settings.name}` : ''}
            </Txt>
          </View>
          <IconButton
            icon={masked ? 'eye-off-outline' : 'eye-outline'}
            label={masked ? 'Tampilkan nominal' : 'Sembunyikan nominal'}
            onPress={() => updateSettings({ hideAmounts: !masked })}
          />
        </View>

        {/* Ringkasan: saldo dominan, lalu arus bulan ini */}
        <View style={styles.hero}>
          <Txt variant="label" tone="ink2">
            Saldo saat ini
          </Txt>
          <Money
            amount={balance}
            variant="display"
            masked={masked}
            tone={balance < 0 && !masked ? 'negative' : 'ink'}
            numberOfLines={1}
            adjustsFontSizeToFit
          />
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Txt variant="label" tone="ink2">
              Pemasukan {BULAN[m]}
            </Txt>
            <Money amount={totals.income} variant="heading" masked={masked} tone={masked ? 'ink' : 'positive'} />
          </View>
          <View style={[styles.vr, { backgroundColor: c.line }]} />
          <View style={styles.stat}>
            <Txt variant="label" tone="ink2">
              Pengeluaran {BULAN[m]}
            </Txt>
            <Money amount={totals.expense} variant="heading" masked={masked} />
          </View>
        </View>

        <Divider style={styles.fullRule} />

        {budget > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Buka halaman budget"
            onPress={() => router.navigate('/budget')}
            style={({ pressed }) => [styles.budget, pressed && { backgroundColor: c.pressed }]}
          >
            <View style={styles.budgetTop}>
              <Txt weight="semibold" style={styles.flex}>
                Budget {BULAN[m]}
              </Txt>
              <StatusLabel status={status} />
            </View>
            <View style={styles.budgetFigures}>
              <Money amount={spent} variant="heading" masked={masked} />
              <Txt variant="label" tone="ink2">
                dari {masked ? MASK : rupiah(budget)}
              </Txt>
            </View>
            <Meter
              ratio={budget > 0 ? spent / budget : 0}
              status={status}
              pace={now.getDate() / daysInMonth(y, m)}
              accessibilityLabel="Pemakaian budget bulan ini"
            />
            <Txt variant="label" tone="ink2" style={styles.budgetLine}>
              {budgetLine}
            </Txt>
          </Pressable>
        ) : (
          <ListRow
            icon="wallet-outline"
            label="Atur budget bulanan"
            description="Tentukan batas belanja supaya sisa uang bulan ini selalu terlihat."
            onPress={() => setBudgetSheet(true)}
          />
        )}

        <Divider style={styles.fullRule} />

        <SectionTitle
          title="Transaksi terbaru"
          action={txs.length > 0 ? { label: 'Lihat semua', onPress: () => router.navigate('/transaksi') } : undefined}
        />
        {recent.length === 0 ? (
          <EmptyState
            icon="create-outline"
            title="Belum ada transaksi."
            body="Mulai catat pengeluaran pertamamu — cukup nominal dan kategori, beberapa detik saja."
            action={{ label: 'Catat transaksi', onPress: () => router.push('/tambah') }}
            secondary={{ label: 'Coba dengan data contoh', onPress: loadSample }}
          />
        ) : (
          recent.map((tx, i) => (
            <View key={tx.id}>
              {i > 0 ? <Divider inset={ROW_INSET} /> : null}
              <TransactionRow
                tx={tx}
                category={categoryOf(catMap, tx)}
                method={tx.methodId ? methodMap.get(tx.methodId) : undefined}
                dateLabel={isSameDay(new Date(tx.date), now) ? undefined : formatRelativeShort(new Date(tx.date), now)}
                onPress={openTx}
              />
            </View>
          ))
        )}
      </ScrollView>

      <AddButton onPress={() => router.push('/tambah')} />

      <AmountSheet
        visible={budgetSheet}
        title="Budget bulanan"
        helper="Batas total pengeluaran setiap bulan. Bisa diubah kapan saja."
        initial={settings.monthlyBudget}
        onClose={() => setBudgetSheet(false)}
        onSubmit={(v) => {
          updateSettings({ monthlyBudget: v });
          setBudgetSheet(false);
          toast({ message: `Budget bulanan ${rupiah(v)} disimpan.` });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 112 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: gutter,
    paddingTop: 12,
    gap: 12,
  },
  hero: { paddingHorizontal: gutter, paddingTop: 28 },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: gutter,
    paddingTop: 20,
    paddingBottom: 22,
  },
  stat: { flex: 1, gap: 2 },
  vr: { width: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  fullRule: { marginHorizontal: gutter },
  budget: { paddingHorizontal: gutter, paddingVertical: 18 },
  budgetTop: { flexDirection: 'row', alignItems: 'center' },
  budgetFigures: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 8, marginBottom: 12 },
  budgetLine: { marginTop: 10 },
});
