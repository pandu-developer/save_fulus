import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CumulativeChart } from '@/components/charts/CumulativeChart';
import { RankedBars, type RankedItem } from '@/components/charts/RankedBars';
import { WeeklyBars } from '@/components/charts/WeeklyBars';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader, SectionTitle } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { Txt } from '@/components/ui/Txt';
import { buildInsights, comparisonLabel } from '@/data/insights';
import {
  comparisonRanges,
  cumulative,
  dailyExpense,
  expenseByCategory,
  totalsBetween,
  useCategoryMap,
  weeklyExpense,
} from '@/data/selectors';
import { useStore } from '@/data/store';
import { BULAN, currentMonth, formatMonth, monthEnd, monthKey, monthStart, sameMonth, shiftMonth, type YearMonth } from '@/lib/date';
import { percent, rupiah } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

const TOP_CATEGORIES = 5;

export default function Statistik() {
  const { c } = useAppTheme();
  const router = useRouter();
  const now = useNow();
  const txs = useStore((s) => s.transactions);
  const monthlyBudget = useStore((s) => s.settings.monthlyBudget);
  const catMap = useCategoryMap();
  const [ym, setYm] = useState<YearMonth>(() => currentMonth());

  const isCurrent = sameMonth(ym, currentMonth(now));
  const today = now.getDate();

  const data = useMemo(() => {
    const ref = new Date(now.getFullYear(), now.getMonth(), today, 23, 59);
    const { cur, before, prev } = comparisonRanges(ym, ref);
    const curTotals = totalsBetween(txs, cur[0], cur[1]);
    const prevTotals = totalsBetween(txs, before[0], before[1]);
    const daily = dailyExpense(txs, ym);
    const elapsed = isCurrent ? today : daily.length;
    const expenseCount = txs.filter((t) => {
      const ts = Date.parse(t.date);
      return t.type === 'expense' && ts >= cur[0].getTime() && ts < cur[1].getTime();
    }).length;
    const byCat = [...expenseByCategory(txs, monthStart(ym), monthEnd(ym)).entries()].sort((a, b) => b[1] - a[1]);
    const ranked: RankedItem[] = byCat.slice(0, TOP_CATEGORIES).map(([id, value]) => {
      const cat = catMap.get(id);
      return { id, label: cat?.label ?? 'Lainnya', icon: cat?.icon ?? 'ellipsis-horizontal-outline', value };
    });
    const rest = byCat.slice(TOP_CATEGORIES).reduce((a, [, v]) => a + v, 0);
    if (rest > 0) ranked.push({ id: '__rest', label: 'Kategori lain', icon: 'ellipsis-horizontal-outline', value: rest });
    return {
      prev,
      spent: curTotals.expense,
      change: prevTotals.expense > 0 ? (curTotals.expense - prevTotals.expense) / prevTotals.expense : null,
      avg: elapsed > 0 ? curTotals.expense / elapsed : 0,
      expenseCount,
      noSpend: daily.slice(0, elapsed).filter((v) => v === 0).length,
      cumCurrent: cumulative(daily).slice(0, elapsed),
      cumPrevious: cumulative(dailyExpense(txs, prev)),
      weeks: weeklyExpense(txs, 6, isCurrent ? ref : new Date(monthEnd(ym).getTime() - 1)),
      ranked,
      insights: buildInsights({ txs, ym, categoryMap: catMap, monthlyBudget, now: ref }),
      vs: comparisonLabel(ym, ref),
    };
    // `now` sengaja diwakili oleh tanggal hari ini agar tidak dihitung ulang tiap menit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txs, ym, catMap, monthlyBudget, isCurrent, today]);

  const up = data.change !== null && data.change > 0.005;
  const down = data.change !== null && data.change < -0.005;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Statistik" />

        <View style={styles.stepper}>
          <IconButton icon="chevron-back" label="Bulan sebelumnya" onPress={() => setYm((v) => shiftMonth(v, -1))} />
          <Txt weight="semibold" align="center" style={styles.flex}>
            {formatMonth(ym)}
          </Txt>
          <IconButton
            icon="chevron-forward"
            label="Bulan berikutnya"
            onPress={() => !isCurrent && setYm((v) => shiftMonth(v, 1))}
            color={isCurrent ? c.line : undefined}
          />
        </View>

        {data.spent === 0 ? (
          <EmptyState
            icon="stats-chart-outline"
            title={`Belum ada pengeluaran di ${formatMonth(ym)}.`}
            body="Statistik dan sorotan muncul setelah ada beberapa transaksi."
            action={isCurrent ? { label: 'Catat transaksi', onPress: () => router.push('/tambah') } : undefined}
          />
        ) : (
          <>
            <View style={styles.hero}>
              <Txt variant="label" tone="ink2">
                Pengeluaran {isCurrent ? 'bulan ini' : BULAN[ym.m]}
                {isCurrent ? ` (1–${today} ${BULAN[ym.m]})` : ''}
              </Txt>
              <Txt variant="display" numberOfLines={1} adjustsFontSizeToFit>
                {rupiah(data.spent)}
              </Txt>
              {data.change === null ? (
                <Txt variant="label" tone="ink3">
                  Belum ada data {BULAN[data.prev.m]} untuk dibandingkan.
                </Txt>
              ) : (
                <View style={styles.delta}>
                  {up || down ? (
                    <Ionicons name={up ? 'arrow-up' : 'arrow-down'} size={14} color={up ? c.negative : c.positive} />
                  ) : null}
                  <Txt variant="label" weight="semibold" tone={up ? 'negative' : down ? 'positive' : 'ink2'}>
                    {up || down
                      ? `${percent(Math.abs(data.change))} ${up ? 'lebih tinggi' : 'lebih rendah'}`
                      : 'Hampir sama'}
                  </Txt>
                  <Txt variant="label" tone="ink2">
                    {' '}
                    dari {data.vs}
                  </Txt>
                </View>
              )}
            </View>

            <View style={styles.kpis}>
              <Kpi label="Rata-rata per hari" value={rupiah(Math.round(data.avg / 100) * 100)} />
              <View style={[styles.vr, { backgroundColor: c.line }]} />
              <Kpi label="Transaksi keluar" value={String(data.expenseCount)} />
              <View style={[styles.vr, { backgroundColor: c.line }]} />
              <Kpi label="Hari tanpa belanja" value={String(data.noSpend)} />
            </View>

            {data.insights.length > 0 ? (
              <>
                <Divider style={styles.rule} />
                <SectionTitle title="Sorotan" />
                {data.insights.map((ins, i) => (
                  <View key={ins.id}>
                    {i > 0 ? <Divider inset={gutter + 30} /> : null}
                    <View style={styles.insight}>
                      <Ionicons
                        name={ins.icon}
                        size={18}
                        color={ins.tone === 'negative' ? c.negative : ins.tone === 'positive' ? c.positive : c.ink3}
                        style={styles.insightIcon}
                      />
                      <Txt style={styles.flex}>{ins.text}</Txt>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            <Divider style={[styles.rule, styles.ruleGap]} />
            <SectionTitle title="Laju pengeluaran" meta={`vs ${BULAN[data.prev.m]}`} />
            <View style={styles.chart}>
              <CumulativeChart month={ym} prevMonth={data.prev} current={data.cumCurrent} previous={data.cumPrevious} />
              <Txt variant="micro" tone="ink3" style={styles.caption}>
                Tahan dan geser pada grafik untuk melihat total per tanggal.
              </Txt>
            </View>

            <Divider style={[styles.rule, styles.ruleGap]} />
            <SectionTitle title="Per minggu" meta="6 minggu terakhir" />
            <View style={styles.chart}>
              <WeeklyBars weeks={data.weeks} />
            </View>

            <Divider style={[styles.rule, styles.ruleGap]} />
            <SectionTitle title="Per kategori" meta={rupiah(data.spent)} />
            <RankedBars
              items={data.ranked}
              total={data.spent}
              onPressItem={(id) => {
                if (id === '__rest') return;
                router.navigate({ pathname: '/transaksi', params: { kategori: id, bulan: monthKey(ym) } });
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Txt variant="micro" tone="ink2" numberOfLines={1}>
        {label}
      </Txt>
      <Txt weight="semibold" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 48 },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter - 10, marginTop: 4 },
  hero: { paddingHorizontal: gutter, paddingTop: 16, gap: 2 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2, flexWrap: 'wrap' },
  kpis: { flexDirection: 'row', paddingHorizontal: gutter, paddingTop: 20, paddingBottom: 20 },
  kpi: { flex: 1, gap: 2 },
  vr: { width: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  rule: { marginHorizontal: gutter },
  ruleGap: { marginTop: 16 },
  insight: { flexDirection: 'row', gap: 12, paddingHorizontal: gutter, paddingVertical: 10 },
  insightIcon: { marginTop: 2 },
  chart: { paddingHorizontal: gutter },
  caption: { marginTop: 8 },
});
