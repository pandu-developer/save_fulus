import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { StackHeader } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { useMethods } from '@/data/selectors';
import { addMethod, removeMethod, useStore } from '@/data/store';
import type { PaymentMethod } from '@/data/types';
import { confirmAction } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter, hairline, radius } from '@/theme/tokens';

export default function KelolaMetode() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const methods = useMethods();
  const txs = useStore((s) => s.transactions);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const label = name.trim();
    if (!label) {
      haptic.warn();
      setError('Tulis nama metodenya dulu.');
      return;
    }
    if (methods.some((mm) => mm.label.toLowerCase() === label.toLowerCase())) {
      haptic.warn();
      setError(`“${label}” sudah ada.`);
      return;
    }
    addMethod({ label, icon: 'wallet-outline' });
    setName('');
    setError(null);
    toast({ message: `Metode “${label}” ditambahkan.` });
  };

  const remove = async (m: PaymentMethod) => {
    const used = txs.filter((t) => t.methodId === m.id).length;
    if (used > 0) {
      const ok = await confirmAction({
        title: `Hapus “${m.label}”?`,
        message: `${used} transaksi tidak lagi punya metode pembayaran.`,
        confirmLabel: 'Hapus',
        destructive: true,
      });
      if (!ok) return;
    }
    removeMethod(m.id);
    toast({ message: 'Metode pembayaran dihapus.' });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StackHeader title="Metode pembayaran" onBack={() => router.back()} />
        <View style={styles.addRow}>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
            maxLength={24}
            placeholder="Metode baru, mis. ShopeePay"
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={add}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Nama metode baru"
            style={[
              styles.input,
              { color: c.ink, backgroundColor: c.surface, borderColor: error ? c.negative : c.lineStrong },
            ]}
          />
          <Button label="Tambah" onPress={add} size="md" />
        </View>
        {error ? (
          <Txt variant="label" tone="negative" style={styles.error}>
            {error}
          </Txt>
        ) : null}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
          {methods.map((m, i) => (
            <View key={m.id}>
              {i > 0 ? <Divider inset={gutter + 34} /> : null}
              <View style={styles.row}>
                <Ionicons name={m.icon} size={20} color={c.ink2} />
                <Txt weight="medium" style={styles.flex}>
                  {m.label}
                </Txt>
                {m.custom ? (
                  <IconButton icon="trash-outline" label={`Hapus ${m.label}`} onPress={() => remove(m)} />
                ) : (
                  <Txt variant="label" tone="ink3">
                    Bawaan
                  </Txt>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: { flexDirection: 'row', gap: 8, paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 8 },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: hairline * 2,
    paddingHorizontal: 12,
    fontFamily: font.regular,
    fontSize: 15,
  },
  error: { paddingHorizontal: gutter, paddingBottom: 8 },
  list: { paddingBottom: 24 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: gutter },
});
