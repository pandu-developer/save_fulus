import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountSheet } from '@/components/AmountSheet';
import { CategoryIcon } from '@/components/CategoryIcon';
import { OptionSheet } from '@/components/OptionSheet';
import { StatusLabel } from '@/components/StatusLabel';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader, SectionTitle } from '@/components/ui/Headers';
import { Meter } from '@/components/ui/Meter';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import {
  budgetStatus,
  daysLeftInMonth,
  expenseByCategory,
  goalEta,
  goalProgress,
  goalSaved,
  useCategories,
  useCategoryMap,
} from '@/data/selectors';
import { setBudget, updateSettings, useStore } from '@/data/store';
import { BULAN, daysInMonth, formatMonth, monthEnd, monthStart } from '@/lib/date';
import { percent, rupiah } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

type Editing = { kind: 'monthly' } | { kind: 'category'; id: string } | null;

export default function Budget() {
  const { c } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const now = useNow();
  const txs = useStore((s) => s.transactions);
  const budgets = useStore((s) => s.budgets);
  const monthly = useStore((s) => s.settings.monthlyBudget);
  const goals = useStore((s) => s.goals);
  const categories = useCategories();
  const catMap = useCategoryMap();
  const [editing, setEditing] = useState<Editing>(null);
  const [picker, setPicker] = useState(false);

  const y = now.getFullYear();
  const m = now.getMonth();
  const spentByCat = useMemo(() => expenseByCategory(txs, monthStart({ y, m }), monthEnd({ y, m })), [txs, y, m]);
  const totalSpent = useMemo(() => [...spentByCat.values()].reduce((a, b) => a + b, 0), [spentByCat]);
  const daysLeft = daysLeftInMonth(now);
  const pace = now.getDate() / daysInMonth(y, m);

  // Kategori paling bermasalah di atas.
  const rows = useMemo(
    () =>
      Object.entries(budgets)
        .flatMap(([id, limit]) => {
          const cat = catMap.get(id);
          return cat ? [{ id, cat, limit, spent: spentByCat.get(id) ?? 0 }] : [];
        })
        .sort((a, b) => b.spent / b.limit - a.spent / a.limit),
    [budgets, catMap, spentByCat],
  );
  const allocated = rows.reduce((a, r) => a + r.limit, 0);
  const unbudgeted = [...spentByCat.entries()]
    .filter(([id]) => !budgets[id])
    .sort((a, b) => b[1] - a[1]);
  const available = categories.filter((cat) => cat.type === 'expense' && !budgets[cat.id]);

  const remaining = monthly - totalSpent;
  const status = budgetStatus(totalSpent, monthly);
  const perDay = Math.floor(Math.max(remaining, 0) / daysLeft / 500) * 500;

  const editingCat = editing?.kind === 'category' ? catMap.get(editing.id) : undefined;
  const editingLimit = editing?.kind === 'category' ? budgets[editing.id] ?? 0 : monthly;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Budget" subtitle={`${formatMonth({ y, m })} · sisa ${daysLeft} hari`} />

        <SectionTitle
          title="Budget bulanan"
          action={monthly > 0 ? { label: 'Ubah', onPress: () => setEditing({ kind: 'monthly' }) } : undefined}
        />
        {monthly > 0 ? (
          <View style={styles.block}>
            <View style={styles.figures}>
              <Txt variant="title" accessibilityLabel={`Terpakai ${rupiah(totalSpent)}`}>
                {rupiah(totalSpent)}
              </Txt>
              <Txt variant="label" tone="ink2">
                dari {rupiah(monthly)}
              </Txt>
            </View>
            <Meter ratio={totalSpent / monthly} status={status} pace={pace} height={8} accessibilityLabel="Pemakaian budget bulanan" />
            <View style={styles.metaRow}>
              <StatusLabel status={status} />
              <Txt variant="label" tone={remaining < 0 ? 'negative' : 'ink2'} tabular>
                {remaining >= 0 ? `Sisa ${rupiah(remaining)} · ${rupiah(perDay)}/hari` : `Lebih ${rupiah(-remaining)}`}
              </Txt>
            </View>
            <Txt variant="micro" tone="ink3" style={styles.note}>
              Garis tipis menandai hari ini ({now.getDate()} dari {daysInMonth(y, m)} hari).
              {allocated > 0 ? ` ${rupiah(allocated)} (${percent(allocated / monthly)}) sudah dibagi ke kategori.` : ''}
            </Txt>
          </View>
        ) : (
          <EmptyState
            title="Belum ada budget bulanan."
            body="Tentukan batas total pengeluaran per bulan. Budget per kategori bisa ditambahkan di bawah."
            action={{ label: 'Atur budget bulanan', onPress: () => setEditing({ kind: 'monthly' }) }}
          />
        )}

        <Divider style={styles.rule} />

        <SectionTitle
          title="Per kategori"
          action={available.length > 0 ? { label: 'Tambah', onPress: () => setPicker(true) } : undefined}
        />
        {rows.length === 0 ? (
          <Txt tone="ink2" style={styles.hint}>
            Batasi kategori yang paling sering bikin boros, misalnya Makanan atau Hiburan.
          </Txt>
        ) : (
          rows.map((r, i) => {
            const st = budgetStatus(r.spent, r.limit);
            const left = r.limit - r.spent;
            return (
              <View key={r.id}>
                {i > 0 ? <Divider inset={gutter + 44} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${r.cat.label}: ${rupiah(r.spent)} dari ${rupiah(r.limit)}`}
                  accessibilityHint="Ubah budget kategori ini"
                  onPress={() => setEditing({ kind: 'category', id: r.id })}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
                >
                  <CategoryIcon icon={r.cat.icon} size="sm" />
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Txt weight="medium" style={styles.flex} numberOfLines={1}>
                        {r.cat.label}
                      </Txt>
                      <StatusLabel status={st} />
                    </View>
                    <View style={styles.rowTop}>
                      <Txt variant="label" tone="ink2" tabular style={styles.flex}>
                        <Txt variant="label" weight="semibold" tabular>
                          {rupiah(r.spent)}
                        </Txt>{' '}
                        / {rupiah(r.limit)}
                      </Txt>
                      <Txt variant="label" tone={left < 0 ? 'negative' : 'ink2'} tabular>
                        {left >= 0 ? `sisa ${rupiah(left)}` : `lebih ${rupiah(-left)}`}
                      </Txt>
                    </View>
                    <Meter ratio={r.spent / r.limit} status={st} />
                  </View>
                </Pressable>
              </View>
            );
          })
        )}

        {unbudgeted.length > 0 ? (
          <View style={styles.unbudgeted}>
            <Txt variant="label" tone="ink2" style={styles.subhead}>
              Belum dianggarkan di {BULAN[m]}
            </Txt>
            {unbudgeted.map(([id, amount]) => {
              const cat = catMap.get(id);
              if (!cat) return null;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityHint="Atur budget untuk kategori ini"
                  onPress={() => setEditing({ kind: 'category', id })}
                  style={({ pressed }) => [styles.slimRow, pressed && { backgroundColor: c.pressed }]}
                >
                  <CategoryIcon icon={cat.icon} size="sm" />
                  <Txt style={styles.flex}>{cat.label}</Txt>
                  <Txt tabular tone="ink2">
                    {rupiah(amount)}
                  </Txt>
                  <Txt variant="label" weight="semibold" color={c.accent}>
                    Atur
                  </Txt>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Divider style={[styles.rule, styles.ruleGap]} />

        <SectionTitle title="Impian" action={{ label: 'Tambah', onPress: () => router.push('/impian/baru') }} />
        {goals.length === 0 ? (
          <EmptyState
            title="Belum ada impian."
            body="Catat barang yang ingin kamu beli, lalu pantau tabungannya sedikit demi sedikit."
            action={{ label: 'Tambah impian', onPress: () => router.push('/impian/baru') }}
          />
        ) : (
          goals.map((g, i) => {
            const saved = goalSaved(g);
            const progress = goalProgress(g);
            const done = saved >= g.targetAmount;
            const eta = done ? null : goalEta(g, now);
            return (
              <View key={g.id}>
                {i > 0 ? <Divider inset={gutter + 44} /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${g.name}: ${rupiah(saved)} dari ${rupiah(g.targetAmount)}`}
                  onPress={() => router.push({ pathname: '/impian/[id]', params: { id: g.id } })}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
                >
                  <CategoryIcon icon={g.icon} size="sm" />
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Txt weight="medium" style={styles.flex} numberOfLines={1}>
                        {g.name}
                      </Txt>
                      <Txt variant="label" tone={done ? 'positive' : 'ink2'} weight={done ? 'semibold' : 'medium'} tabular>
                        {done ? 'Tercapai' : percent(progress)}
                      </Txt>
                    </View>
                    <Txt variant="label" tone="ink2" tabular>
                      <Txt variant="label" weight="semibold" tabular>
                        {rupiah(saved)}
                      </Txt>{' '}
                      dari {rupiah(g.targetAmount)}
                    </Txt>
                    <Meter ratio={progress} />
                    {eta ? (
                      <Txt variant="micro" tone="ink3">
                        Perkiraan tercapai {BULAN[eta.date.getMonth()]} {eta.date.getFullYear()}
                      </Txt>
                    ) : null}
                  </View>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>

      <OptionSheet
        visible={picker}
        title="Budget untuk kategori"
        options={available.map((cat) => ({
          id: cat.id,
          label: cat.label,
          icon: cat.icon,
          description: spentByCat.get(cat.id) ? `Terpakai ${rupiah(spentByCat.get(cat.id) ?? 0)} bulan ini` : undefined,
        }))}
        onSelect={(id) => {
          setPicker(false);
          // Tunggu lembar pertama tertutup sebelum membuka yang kedua (iOS).
          setTimeout(() => setEditing({ kind: 'category', id }), 280);
        }}
        onClose={() => setPicker(false)}
      />

      <AmountSheet
        visible={editing !== null}
        title={editing?.kind === 'category' ? `Budget ${editingCat?.label ?? ''}` : 'Budget bulanan'}
        helper={
          editing?.kind === 'category'
            ? `Terpakai ${rupiah(spentByCat.get(editing.id) ?? 0)} di ${BULAN[m]}.`
            : 'Batas total pengeluaran setiap bulan.'
        }
        initial={editingLimit}
        onClose={() => setEditing(null)}
        onSubmit={(v) => {
          if (editing?.kind === 'category') {
            setBudget(editing.id, v);
            toast({ message: `Budget ${editingCat?.label ?? ''} ${rupiah(v)} disimpan.` });
          } else {
            updateSettings({ monthlyBudget: v });
            toast({ message: `Budget bulanan ${rupiah(v)} disimpan.` });
          }
          setEditing(null);
        }}
        secondary={
          editing?.kind === 'category' && budgets[editing.id]
            ? {
                label: 'Hapus',
                destructive: true,
                onPress: () => {
                  const id = editing.id;
                  const prev = budgets[id];
                  setBudget(id, 0);
                  setEditing(null);
                  toast({
                    message: `Budget ${editingCat?.label ?? ''} dihapus.`,
                    action: { label: 'Urungkan', onPress: () => setBudget(id, prev) },
                  });
                },
              }
            : editing?.kind === 'monthly' && monthly > 0
              ? {
                  label: 'Hapus',
                  destructive: true,
                  onPress: () => {
                    const prev = monthly;
                    updateSettings({ monthlyBudget: 0 });
                    setEditing(null);
                    toast({
                      message: 'Budget bulanan dihapus.',
                      action: { label: 'Urungkan', onPress: () => updateSettings({ monthlyBudget: prev }) },
                    });
                  },
                }
              : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 40 },
  block: { paddingHorizontal: gutter, paddingBottom: 20 },
  figures: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 12 },
  note: { marginTop: 10 },
  rule: { marginHorizontal: gutter },
  ruleGap: { marginTop: 12 },
  hint: { paddingHorizontal: gutter, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: gutter, paddingVertical: 12 },
  rowBody: { flex: 1, gap: 6 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unbudgeted: { paddingTop: 12 },
  subhead: { paddingHorizontal: gutter, paddingBottom: 4 },
  slimRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: gutter, paddingVertical: 8 },
});
