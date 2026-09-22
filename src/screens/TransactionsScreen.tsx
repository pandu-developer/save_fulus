import React, { useMemo, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTransactions } from '../context/TransactionsContext';
import { useTheme } from '../context/ThemeContext';
import { TabScreenNavigationProp } from '../navigation/types';
import { Transaction, TransactionType } from '../types';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { dateKey, labelTanggalRelatif } from '../utils/date';
import TransactionItem from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';
import { SegmentedControl } from '../components/SegmentedControl';

type Filter = 'all' | TransactionType;

interface Section {
  key: string;
  title: string;
  net: number;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { transactions } = useTransactions();
  const [filter, setFilter] = useState<Filter>('all');

  const { sections, totalIncome, totalExpense } = useMemo(() => {
    const filtered = transactions.filter(
      (t) => filter === 'all' || t.type === filter,
    );

    let inc = 0;
    let exp = 0;
    const map = new Map<string, Transaction[]>();

    for (const t of filtered) {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
      const k = dateKey(t.date);
      const arr = map.get(k);
      if (arr) arr.push(t);
      else map.set(k, [t]);
    }

    const keys = [...map.keys()].sort((a, b) => b.localeCompare(a));
    const secs: Section[] = keys.map((k) => {
      const items = map
        .get(k)!
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const net = items.reduce(
        (s, t) => s + (t.type === 'income' ? t.amount : -t.amount),
        0,
      );
      return { key: k, title: labelTanggalRelatif(items[0].date), net, data: items };
    });

    return { sections: secs, totalIncome: inc, totalExpense: exp };
  }, [transactions, filter]);

  return (
    <View style={styles.flex}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Transaksi</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2.5 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pemasukan</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]}>
                  {formatRupiah(totalIncome)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pengeluaran</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]}>
                  {formatRupiah(totalExpense)}
                </Text>
              </View>
            </View>

            <SegmentedControl<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { label: 'Semua', value: 'all' },
                { label: 'Pemasukan', value: 'income', activeColor: colors.income },
                { label: 'Pengeluaran', value: 'expense', activeColor: colors.expense },
              ]}
            />
          </View>
        }
        renderSectionHeader={({ section }) => {
          const s = section as unknown as Section;
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text
                style={[
                  styles.sectionNet,
                  { color: s.net >= 0 ? colors.income : colors.expense },
                ]}
              >
                {s.net >= 0 ? '+' : '-'}
                {formatRupiah(s.net)}
              </Text>
            </View>
          );
        }}
        renderItem={({ item, index, section }) => {
          const isFirst = index === 0;
          const isLast = index === section.data.length - 1;
          return (
            <View
              style={[
                styles.itemWrap,
                isFirst && styles.itemFirst,
                isLast && styles.itemLast,
              ]}
            >
              {!isFirst && <View style={styles.separator} />}
              <TransactionItem
                transaction={item}
                onPress={() =>
                  navigation.navigate('AddTransaction', { transactionId: item.id })
                }
              />
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            subtitle="Catatan transaksimu akan muncul di sini."
          />
        }
      />

      <Fab onPress={() => navigation.navigate('AddTransaction')} />
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
    listHeader: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    summaryCard: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...shadow,
    },
    summaryItem: { flex: 1 },
    summaryDivider: {
      width: 1,
      backgroundColor: c.border,
      marginHorizontal: spacing.md,
    },
    summaryLabel: {
      fontSize: 13,
      color: c.textMuted,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 17,
      fontWeight: '800',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
    },
    sectionNet: {
      fontSize: 14,
      fontWeight: '700',
    },
    itemWrap: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.card,
    },
    itemFirst: {
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    itemLast: {
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    separator: {
      height: 1,
      backgroundColor: c.border,
      marginLeft: 72,
    },
  });
