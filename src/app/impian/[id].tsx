import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountSheet } from '@/components/AmountSheet';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle, StackHeader } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { Meter } from '@/components/ui/Meter';
import { Money } from '@/components/ui/Money';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { goalEta, goalProgress, goalSaved } from '@/data/selectors';
import { addGoalEntry, removeGoalEntry, restoreGoalEntry, useStore } from '@/data/store';
import { BULAN, formatDateMedium } from '@/lib/date';
import { percent, rupiah } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

export default function DetailImpian() {
  const { c } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const [sheet, setSheet] = useState<'add' | 'take' | null>(null);

  if (!goal) {
    return (
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.bg }]}>
        <StackHeader title="Impian" onBack={() => router.back()} />
        <EmptyState title="Impian ini sudah tidak ada." body="Mungkin baru saja dihapus." action={{ label: 'Kembali', onPress: () => router.back() }} />
      </SafeAreaView>
    );
  }

  const saved = goalSaved(goal);
  const progress = goalProgress(goal);
  const remaining = goal.targetAmount - saved;
  const done = remaining <= 0;
  const eta = done ? null : goalEta(goal);
  const history = [...goal.entries].sort((a, b) => b.date.localeCompare(a.date));

  const submit = (amount: number) => {
    const kind = sheet;
    setSheet(null);
    if (kind === 'take') {
      if (amount > saved) {
        toast({ message: `Tabungan yang ada hanya ${rupiah(saved)}.` });
        return;
      }
      addGoalEntry(goal.id, -amount);
      toast({ message: `${rupiah(amount)} diambil dari ${goal.name}.` });
      return;
    }
    addGoalEntry(goal.id, amount);
    haptic.success();
    const reached = saved < goal.targetAmount && saved + amount >= goal.targetAmount;
    toast({ message: reached ? `Target ${goal.name} tercapai.` : `${rupiah(amount)} ditabung untuk ${goal.name}.` });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <StackHeader
        title={goal.name}
        onBack={() => router.back()}
        right={
          <IconButton
            icon="create-outline"
            label="Ubah impian"
            onPress={() => router.push({ pathname: '/impian/baru', params: { id: goal.id } })}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CategoryIcon icon={goal.icon} size="lg" />
          <Txt variant="label" tone="ink2" style={styles.heroLabel}>
            Terkumpul
          </Txt>
          <Money amount={saved} variant="display" colorize={false} numberOfLines={1} adjustsFontSizeToFit />
          <Txt variant="label" tone="ink2">
            dari target {rupiah(goal.targetAmount)}
          </Txt>
          <View style={styles.meter}>
            <Meter ratio={progress} height={8} accessibilityLabel={`Progres ${percent(progress)}`} />
          </View>
          <View style={styles.metaRow}>
            <Txt variant="label" weight="semibold" tone={done ? 'positive' : 'ink'}>
              {done ? 'Target tercapai' : percent(progress)}
            </Txt>
            {!done ? (
              <Txt variant="label" tone="ink2" tabular>
                Kurang {rupiah(remaining)}
              </Txt>
            ) : null}
          </View>
          <Txt variant="label" tone="ink2" style={styles.eta}>
            {done
              ? 'Tabungan sudah cukup. Saatnya mewujudkannya.'
              : eta
                ? `Perkiraan tercapai ${BULAN[eta.date.getMonth()]} ${eta.date.getFullYear()} bila menabung sekitar ${rupiah(Math.round(eta.perMonth / 10000) * 10000)} per bulan.`
                : 'Menabung rutin beberapa kali akan memunculkan perkiraan waktu tercapai.'}
          </Txt>
        </View>

        <View style={styles.actions}>
          <Button label="Tambah tabungan" icon="add" size="lg" onPress={() => setSheet('add')} style={styles.flex} />
          <Button label="Ambil" variant="secondary" size="lg" onPress={() => setSheet('take')} disabled={saved <= 0} />
        </View>

        <SectionTitle title="Riwayat" />
        {history.length === 0 ? (
          <Txt tone="ink2" style={styles.pad}>
            Belum ada tabungan. Mulai dari nominal kecil juga tidak apa-apa.
          </Txt>
        ) : (
          history.map((e, i) => (
            <View key={e.id}>
              {i > 0 ? <Divider inset={gutter} /> : null}
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Money amount={Math.abs(e.amount)} type={e.amount >= 0 ? 'income' : 'expense'} weight="semibold" tabular />
                  <Txt variant="label" tone="ink2">
                    {formatDateMedium(new Date(e.date))} · {e.amount >= 0 ? 'Ditabung' : 'Diambil'}
                  </Txt>
                </View>
                <IconButton
                  icon="close"
                  label="Hapus catatan ini"
                  onPress={() => {
                    const removed = removeGoalEntry(goal.id, e.id);
                    if (removed) {
                      toast({
                        message: 'Catatan tabungan dihapus.',
                        action: { label: 'Urungkan', onPress: () => restoreGoalEntry(goal.id, removed) },
                      });
                    }
                  }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <AmountSheet
        visible={sheet !== null}
        title={sheet === 'take' ? 'Ambil dari tabungan' : 'Tambah tabungan'}
        helper={sheet === 'take' ? `Tersedia ${rupiah(saved)}.` : `Untuk ${goal.name}. Kurang ${rupiah(Math.max(remaining, 0))} lagi.`}
        submitLabel={sheet === 'take' ? 'Ambil' : 'Tabung'}
        onClose={() => setSheet(null)}
        onSubmit={submit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 40 },
  pad: { paddingHorizontal: gutter },
  hero: { paddingHorizontal: gutter, paddingTop: 12 },
  heroLabel: { marginTop: 16 },
  meter: { marginTop: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  eta: { marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: gutter, paddingTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: gutter, paddingRight: gutter - 10, paddingVertical: 10 },
});
