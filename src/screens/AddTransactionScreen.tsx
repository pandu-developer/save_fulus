import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { useTransactions } from '../context/TransactionsContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import { TransactionType } from '../types';
import { getCategoriesByType, getCategoryById } from '../constants/categories';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatAngka, formatInputAngka, parseAngka } from '../utils/format';
import { formatTanggalPanjang } from '../utils/date';

export default function AddTransactionScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddTransaction'>>();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { addTransaction, updateTransaction, deleteTransaction, getById } =
    useTransactions();

  const editId = route.params?.transactionId;
  const existing = editId ? getById(editId) : undefined;
  const isEditing = !!existing;

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [amountText, setAmountText] = useState(
    existing ? formatAngka(existing.amount) : '',
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.categoryId ?? null,
  );
  const [date, setDate] = useState<Date>(
    existing ? new Date(existing.date) : new Date(),
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [showPicker, setShowPicker] = useState(false);

  const accent = type === 'income' ? colors.income : colors.expense;
  const categories = getCategoriesByType(type);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    if (categoryId) {
      const cat = getCategoryById(categoryId);
      if (cat && cat.type !== next) setCategoryId(null);
    }
  }

  function handleChangeDate(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && selected) setDate(selected);
    else if (event.type === 'dismissed') setShowPicker(false);
  }

  function handleSave() {
    const amount = parseAngka(amountText);
    if (amount <= 0) {
      Alert.alert('Nominal belum diisi', 'Masukkan nominal lebih dari 0.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Pilih kategori', 'Silakan pilih kategori terlebih dahulu.');
      return;
    }
    const payload = {
      type,
      amount,
      categoryId,
      note: note.trim(),
      date: date.toISOString(),
    };
    if (existing) updateTransaction(existing.id, payload);
    else addTransaction(payload);
    navigation.goBack();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Hapus transaksi?', 'Transaksi ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Transaksi' : 'Tambah Transaksi'}
        </Text>
        {isEditing ? (
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.expense} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle jenis */}
        <View style={styles.typeToggle}>
          <Pressable
            onPress={() => handleTypeChange('expense')}
            style={[
              styles.typeBtn,
              type === 'expense' && { backgroundColor: colors.expense },
            ]}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={type === 'expense' ? colors.white : colors.textMuted}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: type === 'expense' ? colors.white : colors.textMuted },
              ]}
            >
              Pengeluaran
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTypeChange('income')}
            style={[
              styles.typeBtn,
              type === 'income' && { backgroundColor: colors.income },
            ]}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={type === 'income' ? colors.white : colors.textMuted}
            />
            <Text
              style={[
                styles.typeLabel,
                { color: type === 'income' ? colors.white : colors.textMuted },
              ]}
            >
              Pemasukan
            </Text>
          </Pressable>
        </View>

        {/* Nominal */}
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor:
                type === 'income' ? colors.incomeSoft : colors.expenseSoft,
            },
          ]}
        >
          <Text style={[styles.amountLabel, { color: accent }]}>Nominal</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.rp, { color: accent }]}>Rp</Text>
            <TextInput
              value={amountText}
              onChangeText={(t) => setAmountText(formatInputAngka(t))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={accent + '66'}
              style={[styles.amountInput, { color: accent }]}
              autoFocus={!isEditing}
              maxLength={15}
            />
          </View>
        </View>

        {/* Kategori */}
        <Text style={styles.sectionLabel}>Kategori</Text>
        <View style={styles.grid}>
          {categories.map((cat) => {
            const selected = cat.id === categoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={styles.gridItem}
              >
                <View
                  style={[
                    styles.catIcon,
                    { backgroundColor: cat.color + '1A' },
                    selected && {
                      backgroundColor: cat.color,
                      ...shadow,
                      shadowColor: cat.color,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={selected ? colors.white : cat.color}
                  />
                </View>
                <Text
                  style={[
                    styles.catLabel,
                    selected && { color: colors.text, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tanggal */}
        <Text style={styles.sectionLabel}>Tanggal</Text>
        <Pressable style={styles.fieldRow} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
          <Text style={styles.fieldValue}>
            {formatTanggalPanjang(date.toISOString())}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </Pressable>

        {showPicker && (
          <View>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              themeVariant={scheme}
              onChange={handleChangeDate}
            />
            {Platform.OS === 'ios' && (
              <Pressable
                style={styles.iosDone}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.iosDoneText}>Selesai</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Catatan */}
        <Text style={styles.sectionLabel}>Catatan (opsional)</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="create-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="mis. Makan siang di kantin"
            placeholderTextColor={colors.textLight}
            style={styles.noteInput}
            maxLength={100}
          />
        </View>
      </ScrollView>

      {/* Tombol simpan */}
      <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: accent },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.saveText}>
            {isEditing ? 'Simpan Perubahan' : 'Simpan'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.card,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
    },
    typeToggle: {
      flexDirection: 'row',
      gap: spacing.sm,
      margin: spacing.lg,
      marginBottom: spacing.sm,
    },
    typeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.card,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    amountCard: {
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      padding: spacing.xl,
      marginBottom: spacing.md,
    },
    amountLabel: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rp: {
      fontSize: 26,
      fontWeight: '800',
    },
    amountInput: {
      flex: 1,
      fontSize: 36,
      fontWeight: '800',
      padding: 0,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.md,
    },
    gridItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    catIcon: {
      width: 54,
      height: 54,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    catLabel: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
    },
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.card,
      marginHorizontal: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    fieldValue: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    noteInput: {
      flex: 1,
      fontSize: 15,
      color: c.text,
      padding: 0,
    },
    iosDone: {
      alignSelf: 'flex-end',
      marginHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    iosDoneText: {
      color: c.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    saveBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    saveBtn: {
      paddingVertical: spacing.md + 2,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    saveText: {
      color: c.white,
      fontSize: 16,
      fontWeight: '800',
    },
  });
