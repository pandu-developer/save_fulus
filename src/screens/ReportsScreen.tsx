import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTransactions } from '../context/TransactionsContext';
import { useTheme } from '../context/ThemeContext';
import { TransactionType } from '../types';
import { getCategoryById } from '../constants/categories';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { namaBulan } from '../utils/date';
import { SegmentedControl } from '../components/SegmentedControl';
import { EmptyState } from '../components/EmptyState';

interface Row {
  categoryId: string;
  total: number;
  pct: number;
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { transactions } = useTransactions();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [type, setType] = useState<TransactionType>('expense');

  const { rows, monthIncome, monthExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const totals = new Map<string, number>();

    for (const t of transactions) {
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
      if (t.type === type) {
        totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
      }
    }

    const sum = type === 'income' ? inc : exp;
    const list: Row[] = [...totals.entries()]
      .map(([categoryId, total]) => ({
        categoryId,
        total,
        pct: sum > 0 ? (total / sum) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { rows: list, monthIncome: inc, monthExpense: exp };
  }, [transactions, year, month, type]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  }

  const balance = monthIncome - monthExpense;

  return (
    <View style={styles.flex}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Laporan</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pemilih bulan */}
        <View style={styles.monthPicker}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} style={styles.arrow}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {namaBulan(month)} {year}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={8} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Ringkasan bulan */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Pemasukan</Text>
              <Text style={[styles.summaryValue, { color: colors.income }]}>
                {formatRupiah(monthIncome)}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Pengeluaran</Text>
              <Text style={[styles.summaryValue, { color: colors.expense }]}>
                {formatRupiah(monthExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryBottom}>
            <Text style={styles.summaryLabel}>Selisih</Text>
            <Text
              style={[
                styles.balanceValue,
                { color: balance >= 0 ? colors.income : colors.expense },
              ]}
            >
              {formatRupiah(balance)}
            </Text>
          </View>
        </View>

        {/* Toggle jenis */}
        <View style={styles.toggleWrap}>
          <SegmentedControl<TransactionType>
            value={type}
            onChange={setType}
            options={[
              { label: 'Pengeluaran', value: 'expense', activeColor: colors.expense },
              { label: 'Pemasukan', value: 'income', activeColor: colors.income },
            ]}
          />
        </View>

        {/* Rincian kategori */}
        {rows.length === 0 ? (
          <EmptyState
            icon="pie-chart-outline"
            title="Belum ada data"
            subtitle={`Tidak ada ${
              type === 'income' ? 'pemasukan' : 'pengeluaran'
            } pada ${namaBulan(month)} ${year}.`}
          />
        ) : (
          <View style={styles.card}>
            {rows.map((row) => {
              const cat = getCategoryById(row.categoryId);
              const color = cat?.color ?? colors.textMuted;
              return (
                <View key={row.categoryId} style={styles.row}>
                  <View style={[styles.rowIcon, { backgroundColor: color + '1A' }]}>
                    <Ionicons
                      name={(cat?.icon ?? 'pricetag-outline') as any}
                      size={20}
                      color={color}
                    />
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowLabel}>{cat?.label ?? 'Lainnya'}</Text>
                      <Text style={styles.rowAmount}>{formatRupiah(row.total)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          { width: `${Math.max(row.pct, 3)}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                    <Text style={styles.pct}>{row.pct.toFixed(1)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    headerBar: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.background,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
    },
    monthPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.card,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      ...shadow,
    },
    arrow: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: c.text,
    },
    summaryCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...shadow,
    },
    summaryTop: {
      flexDirection: 'row',
    },
    summaryCol: { flex: 1 },
    summaryLabel: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    summaryBottom: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    balanceValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    toggleWrap: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    rowLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    rowAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
    },
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 4,
    },
    pct: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 4,
    },
  });
