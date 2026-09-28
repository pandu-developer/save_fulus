import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { StackHeader } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { Segmented } from '@/components/ui/Segmented';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { useCategories } from '@/data/selectors';
import { removeCategory, useStore } from '@/data/store';
import type { Category, TxType } from '@/data/types';
import { confirmAction } from '@/lib/confirm';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

export default function KelolaKategori() {
  const { c } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const categories = useCategories();
  const txs = useStore((s) => s.transactions);
  const [type, setType] = useState<TxType>('expense');
  const list = categories.filter((cat) => cat.type === type);

  const remove = async (cat: Category) => {
    const used = txs.filter((t) => t.categoryId === cat.id).length;
    if (used > 0) {
      const ok = await confirmAction({
        title: `Hapus “${cat.label}”?`,
        message: `${used} transaksi akan dipindah ke kategori Lainnya.`,
        confirmLabel: 'Hapus',
        destructive: true,
      });
      if (!ok) return;
    }
    const moved = removeCategory(cat.id);
    toast({ message: moved > 0 ? `Kategori dihapus. ${moved} transaksi dipindah ke Lainnya.` : 'Kategori dihapus.' });
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <StackHeader title="Kategori" onBack={() => router.back()} />
      <View style={styles.pad}>
        <Segmented
          accessibilityLabel="Jenis kategori"
          value={type}
          onChange={setType}
          options={[
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {list.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 ? <Divider inset={gutter + 44} /> : null}
            <View style={styles.row}>
              <CategoryIcon icon={cat.icon} type={cat.type} size="sm" />
              <Txt weight="medium" style={styles.flex}>
                {cat.label}
              </Txt>
              {cat.custom ? (
                <IconButton icon="trash-outline" label={`Hapus ${cat.label}`} onPress={() => remove(cat)} />
              ) : (
                <Txt variant="label" tone="ink3">
                  Bawaan
                </Txt>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Kategori baru"
          icon="add"
          variant="secondary"
          size="lg"
          onPress={() => router.push({ pathname: '/kategori-baru', params: { type } })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { paddingHorizontal: gutter, paddingBottom: 8 },
  list: { paddingBottom: 16 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: gutter },
  footer: { paddingHorizontal: gutter, paddingVertical: 8 },
});
