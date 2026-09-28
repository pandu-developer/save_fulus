import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountSheet } from '@/components/AmountSheet';
import { FieldRow } from '@/components/FieldRow';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { StackHeader } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { GOAL_ICON_CHOICES } from '@/data/defaults';
import { addGoal, removeGoal, restoreGoal, updateGoal, useStore } from '@/data/store';
import type { IconName } from '@/data/types';
import { rupiah } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter, hairline, radius } from '@/theme/tokens';

export default function ImpianBaru() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => (id ? s.goals.find((g) => g.id === id) : undefined));

  const [name, setName] = useState(existing?.name ?? '');
  const [target, setTarget] = useState(existing?.targetAmount ?? 0);
  const [initial, setInitial] = useState(0);
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? GOAL_ICON_CHOICES[0]);
  const [sheet, setSheet] = useState<'target' | 'initial' | null>(null);
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});

  const save = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Beri nama impiannya dulu.';
    if (target <= 0) next.target = 'Tentukan targetnya.';
    if (next.name || next.target) {
      haptic.warn();
      setErrors(next);
      return;
    }
    haptic.success();
    if (existing) {
      updateGoal(existing.id, { name: name.trim(), targetAmount: target, icon });
      router.back();
      toast({ message: 'Impian diperbarui.' });
    } else {
      addGoal({ name, targetAmount: target, icon, initial });
      router.back();
      toast({ message: `Impian “${name.trim()}” ditambahkan.` });
    }
  };

  const remove = () => {
    if (!existing) return;
    const removed = removeGoal(existing.id);
    router.dismissTo('/budget');
    if (removed) {
      toast({ message: 'Impian dihapus.', action: { label: 'Urungkan', onPress: () => restoreGoal(removed) } });
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StackHeader
          title={existing ? 'Ubah impian' : 'Impian baru'}
          icon="close"
          onBack={() => router.back()}
          right={existing ? <IconButton icon="trash-outline" label="Hapus impian" onPress={remove} color={c.negative} /> : null}
        />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.pad}>
            <Txt variant="label" tone={errors.name ? 'negative' : 'ink2'} style={styles.label}>
              {errors.name ?? 'Nama impian'}
            </Txt>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setErrors((e) => ({ ...e, name: undefined }));
              }}
              autoFocus={!existing}
              maxLength={32}
              placeholder="mis. Laptop baru, Liburan ke Jogja"
              placeholderTextColor={c.ink3}
              returnKeyType="done"
              keyboardAppearance={isDark ? 'dark' : 'light'}
              accessibilityLabel="Nama impian"
              style={[
                styles.input,
                { color: c.ink, backgroundColor: c.surface, borderColor: errors.name ? c.negative : c.lineStrong },
              ]}
            />
          </View>

          <View style={styles.fields}>
            <Divider style={styles.rule} />
            <FieldRow
              icon="flag-outline"
              label="Target"
              value={target > 0 ? rupiah(target) : undefined}
              placeholder="Belum diisi"
              error={!!errors.target}
              onPress={() => setSheet('target')}
            />
            {!existing ? (
              <>
                <Divider style={styles.rule} />
                <FieldRow
                  icon="wallet-outline"
                  label="Terkumpul"
                  value={initial > 0 ? rupiah(initial) : undefined}
                  placeholder="Rp0 (opsional)"
                  onPress={() => setSheet('initial')}
                />
              </>
            ) : null}
            <Divider style={styles.rule} />
          </View>
          {errors.target ? (
            <Txt variant="label" tone="negative" style={styles.pad}>
              {errors.target}
            </Txt>
          ) : null}

          <Txt variant="label" tone="ink2" style={[styles.pad, styles.label]}>
            Ikon
          </Txt>
          <View style={styles.grid}>
            {GOAL_ICON_CHOICES.map((choice) => {
              const selected = choice === icon;
              return (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  accessibilityLabel={`Ikon ${choice.replace('-outline', '')}`}
                  accessibilityState={{ selected }}
                  onPress={() => setIcon(choice)}
                  style={styles.cell}
                >
                  {({ pressed }) => (
                    <View style={[styles.iconBox, { backgroundColor: selected ? c.accent : pressed ? c.pressed : c.panel }]}>
                      <Ionicons name={choice} size={20} color={selected ? c.onAccent : c.ink2} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label={existing ? 'Simpan perubahan' : 'Simpan impian'} onPress={save} size="lg" />
        </View>
      </KeyboardAvoidingView>

      <AmountSheet
        visible={sheet !== null}
        title={sheet === 'target' ? 'Target harga' : 'Sudah terkumpul'}
        helper={sheet === 'target' ? 'Perkiraan harga barang atau jumlah yang ingin dikumpulkan.' : 'Tabungan yang sudah ada untuk impian ini.'}
        initial={sheet === 'target' ? target : initial}
        allowZero={sheet === 'initial'}
        onClose={() => setSheet(null)}
        onSubmit={(v) => {
          if (sheet === 'target') {
            setTarget(v);
            setErrors((e) => ({ ...e, target: undefined }));
          } else {
            setInitial(v);
          }
          setSheet(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  pad: { paddingHorizontal: gutter },
  label: { marginTop: 12, marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: hairline * 2,
    paddingHorizontal: 14,
    fontFamily: font.regular,
    fontSize: 15,
  },
  fields: { marginTop: 18, marginBottom: 8 },
  rule: { marginHorizontal: gutter },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: gutter - 4 },
  cell: { width: '16.66%', padding: 4, alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: gutter, paddingVertical: 8 },
});
