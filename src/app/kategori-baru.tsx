import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { StackHeader } from '@/components/ui/Headers';
import { Segmented } from '@/components/ui/Segmented';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { CATEGORY_ICON_CHOICES } from '@/data/defaults';
import { useCategories } from '@/data/selectors';
import { addCategory } from '@/data/store';
import type { IconName, TxType } from '@/data/types';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter, hairline, radius } from '@/theme/tokens';

export default function KategoriBaru() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ type?: string; pilih?: string }>();
  const categories = useCategories();
  const [type, setType] = useState<TxType>(params.type === 'income' ? 'income' : 'expense');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>(CATEGORY_ICON_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const label = name.trim();
    if (!label) {
      haptic.warn();
      setError('Beri nama kategorinya dulu.');
      return;
    }
    if (categories.some((cat) => cat.type === type && cat.label.toLowerCase() === label.toLowerCase())) {
      haptic.warn();
      setError(`Kategori “${label}” sudah ada.`);
      return;
    }
    addCategory({ label, icon, type }, params.pilih === '1');
    haptic.success();
    router.back();
    toast({ message: `Kategori “${label}” ditambahkan.` });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StackHeader title="Kategori baru" icon="close" onBack={() => router.back()} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Segmented
            accessibilityLabel="Jenis kategori"
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: 'Pengeluaran' },
              { value: 'income', label: 'Pemasukan' },
            ]}
          />

          <Txt variant="label" tone={error ? 'negative' : 'ink2'} style={styles.label}>
            {error ?? 'Nama'}
          </Txt>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
            autoFocus
            maxLength={24}
            placeholder="mis. Kopi, Hewan peliharaan, Olahraga"
            placeholderTextColor={c.ink3}
            returnKeyType="done"
            onSubmitEditing={save}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            accessibilityLabel="Nama kategori"
            style={[
              styles.input,
              { color: c.ink, backgroundColor: c.surface, borderColor: error ? c.negative : c.lineStrong },
            ]}
          />

          <Txt variant="label" tone="ink2" style={styles.label}>
            Ikon
          </Txt>
          <View style={styles.grid}>
            {CATEGORY_ICON_CHOICES.map((choice) => {
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
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: selected ? c.accent : pressed ? c.pressed : c.panel,
                        },
                      ]}
                    >
                      <Ionicons name={choice} size={20} color={selected ? c.onAccent : c.ink2} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Simpan kategori" onPress={save} size="lg" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 24 },
  label: { marginTop: 22, marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: hairline * 2,
    paddingHorizontal: 14,
    fontFamily: font.regular,
    fontSize: 15,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '20%', padding: 4, alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: gutter, paddingVertical: 8 },
});
