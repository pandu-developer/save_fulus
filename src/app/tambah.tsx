import { useCallback, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountDisplay } from '@/components/AmountDisplay';
import { DateSheet } from '@/components/DateSheet';
import { FieldRow } from '@/components/FieldRow';
import { Keypad, useAmountInput } from '@/components/Keypad';
import { OptionSheet } from '@/components/OptionSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Divider } from '@/components/ui/Divider';
import { StackHeader } from '@/components/ui/Headers';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { Segmented } from '@/components/ui/Segmented';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { categoryUsage, useCategories, useMethods } from '@/data/selectors';
import {
  addTransaction,
  consumeCreatedCategory,
  removeTransaction,
  restoreTransaction,
  updateTransaction,
  useStore,
} from '@/data/store';
import type { TxInput, TxType } from '@/data/types';
import { formatRelativeShort, formatTime } from '@/lib/date';
import { rupiahSigned } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { font, gutter } from '@/theme/tokens';

const NO_METHOD = '__none__';

export default function TambahTransaksi() {
  const { c, isDark } = useAppTheme();
  const router = useRouter();
  const toast = useToast();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  const existing = useStore((s) => (params.id ? s.transactions.find((t) => t.id === params.id) : undefined));
  const txs = useStore((s) => s.transactions);
  const lastMethod = useStore((s) => s.settings.lastMethod);
  const categories = useCategories();
  const methods = useMethods();

  const [type, setType] = useState<TxType>(existing?.type ?? (params.type === 'income' ? 'income' : 'expense'));
  const amount = useAmountInput(existing?.amount ?? 0);
  const [categoryId, setCategoryId] = useState<string | null>(existing?.categoryId ?? null);
  const [methodId, setMethodId] = useState<string | undefined>(existing ? existing.methodId : lastMethod[type]);
  const [date, setDate] = useState(() => (existing ? new Date(existing.date) : new Date()));
  const [note, setNote] = useState(existing?.note ?? '');
  const [typing, setTyping] = useState(false);
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});
  const [sheet, setSheet] = useState<'date' | 'method' | null>(null);

  // Kategori yang paling sering dipakai tampil lebih dulu.
  const usage = useMemo(() => categoryUsage(txs, type), [txs, type]);
  const typeCategories = useMemo(
    () =>
      categories
        .filter((cat) => cat.type === type)
        .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0)),
    [categories, type, usage],
  );

  // Kategori yang baru dibuat dari layar "Kategori baru" langsung terpilih.
  useFocusEffect(
    useCallback(() => {
      const created = consumeCreatedCategory();
      if (created) {
        setCategoryId(created);
        setErrors((e) => ({ ...e, category: undefined }));
      }
    }, []),
  );

  const changeType = (next: TxType) => {
    setType(next);
    setCategoryId((prev) => (prev && categories.find((cat) => cat.id === prev)?.type === next ? prev : null));
    if (!existing) setMethodId(lastMethod[next]);
    setErrors({});
  };

  const method = methods.find((mm) => mm.id === methodId);
  const selectedCategory = categories.find((cat) => cat.id === categoryId);

  const save = () => {
    const next: typeof errors = {};
    if (amount.value <= 0) next.amount = 'Nominalnya belum diisi.';
    if (!categoryId) next.category = 'Pilih kategori dulu.';
    if (next.amount || next.category) {
      haptic.warn();
      setErrors(next);
      return;
    }
    const input: TxInput = {
      type,
      amount: amount.value,
      categoryId: categoryId!,
      methodId,
      note: note.trim(),
      date: date.toISOString(),
    };
    haptic.success();
    const title = input.note || selectedCategory?.label || 'Transaksi';
    if (existing) {
      updateTransaction(existing.id, input);
      router.back();
      toast({ message: 'Perubahan disimpan.' });
    } else {
      const tx = addTransaction(input);
      router.back();
      toast({
        message: `${title} ${rupiahSigned(input.amount, type)} tersimpan.`,
        action: { label: 'Urungkan', onPress: () => removeTransaction(tx.id) },
      });
    }
  };

  const remove = () => {
    if (!existing) return;
    const removed = removeTransaction(existing.id);
    router.back();
    if (removed) {
      toast({ message: 'Transaksi dihapus.', action: { label: 'Urungkan', onPress: () => restoreTransaction(removed) } });
    }
  };

  const saveLabel = existing ? 'Simpan perubahan' : type === 'income' ? 'Simpan pemasukan' : 'Simpan pengeluaran';

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.flex, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StackHeader
          title={existing ? 'Ubah transaksi' : 'Tambah transaksi'}
          icon="close"
          onBack={() => router.back()}
          right={
            existing ? (
              <IconButton icon="trash-outline" label="Hapus transaksi" onPress={remove} color={c.negative} />
            ) : null
          }
        />

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <View style={styles.pad}>
            <Segmented
              accessibilityLabel="Jenis transaksi"
              value={type}
              onChange={changeType}
              options={[
                { value: 'expense', label: 'Pengeluaran' },
                { value: 'income', label: 'Pemasukan' },
              ]}
            />
          </View>

          {/* Nominal — fokus utama. Ketuk untuk kembali ke keypad saat sedang mengetik catatan. */}
          <Pressable accessible={false} onPress={() => Keyboard.dismiss()} style={styles.amount}>
            <AmountDisplay value={amount.value} tone={type === 'income' ? 'positive' : 'ink'} />
            <Txt variant="label" tone="negative" align="center" style={styles.error}>
              {errors.amount ?? ' '}
            </Txt>
          </Pressable>

          <Txt variant="label" tone={errors.category ? 'negative' : 'ink2'} style={styles.fieldLabel}>
            {errors.category ?? 'Kategori'}
          </Txt>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.chipBar}
            contentContainerStyle={styles.chips}
          >
            {typeCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                selected={cat.id === categoryId}
                onPress={() => {
                  haptic.tap();
                  setCategoryId(cat.id);
                  setErrors((e) => ({ ...e, category: undefined }));
                }}
              />
            ))}
            <Chip
              label="Kategori baru"
              icon="add"
              onPress={() => router.push({ pathname: '/kategori-baru', params: { type, pilih: '1' } })}
            />
          </ScrollView>

          <View style={styles.fields}>
            <Divider style={styles.rule} />
            <FieldRow icon="create-outline" label="Catatan">
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Makan siang, Grab, kopi…"
                placeholderTextColor={c.ink3}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
                returnKeyType="done"
                maxLength={60}
                keyboardAppearance={isDark ? 'dark' : 'light'}
                accessibilityLabel="Catatan"
                style={[styles.input, { color: c.ink }]}
              />
            </FieldRow>
            <Divider style={styles.rule} />
            <FieldRow
              icon="calendar-outline"
              label="Tanggal"
              value={`${formatRelativeShort(date)}, ${formatTime(date)}`}
              onPress={() => {
                Keyboard.dismiss();
                setSheet('date');
              }}
            />
            <Divider style={styles.rule} />
            <FieldRow
              icon="card-outline"
              label="Metode"
              value={method?.label}
              placeholder="Tidak dicatat"
              onPress={() => {
                Keyboard.dismiss();
                setSheet('method');
              }}
            />
            <Divider style={styles.rule} />
          </View>
        </ScrollView>

        <View style={[styles.bottom, { backgroundColor: c.surface, borderTopColor: c.line }]}>
          {typing ? null : (
            <Keypad
              onKey={(k) => {
                setErrors((e) => ({ ...e, amount: undefined }));
                amount.press(k);
              }}
            />
          )}
          <Button label={saveLabel} onPress={save} size="lg" style={styles.save} />
        </View>
      </KeyboardAvoidingView>

      <DateSheet visible={sheet === 'date'} value={date} onChange={setDate} onClose={() => setSheet(null)} />
      <OptionSheet
        visible={sheet === 'method'}
        title="Metode pembayaran"
        selectedId={methodId ?? NO_METHOD}
        options={[
          { id: NO_METHOD, label: 'Tidak dicatat', icon: 'remove-outline' },
          ...methods.map((mm) => ({ id: mm.id, label: mm.label, icon: mm.icon })),
        ]}
        onSelect={(id) => {
          setMethodId(id === NO_METHOD ? undefined : id);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
        footer={
          <ListRow
            icon="settings-outline"
            label="Kelola metode pembayaran"
            onPress={() => {
              setSheet(null);
              router.push('/metode');
            }}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 12 },
  pad: { paddingHorizontal: gutter, paddingTop: 4 },
  amount: { paddingTop: 22, paddingBottom: 6, paddingHorizontal: gutter },
  error: { marginTop: 4 },
  fieldLabel: { paddingHorizontal: gutter, marginBottom: 8 },
  chipBar: { flexGrow: 0, flexShrink: 0, height: 44 },
  chips: { paddingHorizontal: gutter, gap: 8, alignItems: 'center' },
  fields: { marginTop: 16 },
  rule: { marginHorizontal: gutter },
  input: {
    width: '100%',
    fontFamily: font.regular,
    fontSize: 15,
    textAlign: 'right',
    paddingVertical: 14,
  },
  bottom: {
    paddingHorizontal: gutter - 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  save: { marginHorizontal: 8 },
});
