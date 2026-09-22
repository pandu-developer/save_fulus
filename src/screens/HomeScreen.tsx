import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTransactions } from '../context/TransactionsContext';
import { useTheme } from '../context/ThemeContext';
import { TabScreenNavigationProp } from '../navigation/types';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { namaBulan, salamWaktu, labelTanggalRelatif } from '../utils/date';
import TransactionItem from '../components/TransactionItem';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';

export default function HomeScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { transactions, loading } = useTransactions();

  const { balance, monthIncome, monthExpense, recent } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    let bal = 0;
    let mIncome = 0;
    let mExpense = 0;

    for (const t of transactions) {
      bal += t.type === 'income' ? t.amount : -t.amount;
      const d = new Date(t.date);
      if (d.getFullYear() === y && d.getMonth() === m) {
        if (t.type === 'income') mIncome += t.amount;
        else mExpense += t.amount;
      }
    }

    const sorted = [...transactions].sort((a, b) => {
      if (a.date === b.date) return b.createdAt.localeCompare(a.createdAt);
      return b.date.localeCompare(a.date);
    });

    return {
      balance: bal,
      monthIncome: mIncome,
      monthExpense: mExpense,
      recent: sorted.slice(0, 6),
    };
  }, [transactions]);

  const now = new Date();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: spacing.xxl * 2,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Sapaan + toggle tema */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{salamWaktu()} 👋</Text>
            <Text style={styles.subGreeting}>
              {namaBulan(now.getMonth())} {now.getFullYear()}
            </Text>
          </View>
          <Pressable onPress={toggleTheme} hitSlop={8} style={styles.themeBtn}>
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={20}
              color={colors.text}
            />
          </Pressable>
        </View>

        {/* Kartu saldo */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Saldo</Text>
          <Text style={styles.balanceValue}>{formatRupiah(balance)}</Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <View style={styles.statIcon}>
                <Ionicons name="arrow-down" size={16} color={colors.white} />
              </View>
              <View>
                <Text style={styles.statLabel}>Pemasukan</Text>
                <Text style={styles.statValue}>{formatRupiah(monthIncome)}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.balanceStat}>
              <View style={styles.statIcon}>
                <Ionicons name="arrow-up" size={16} color={colors.white} />
              </View>
              <View>
                <Text style={styles.statLabel}>Pengeluaran</Text>
                <Text style={styles.statValue}>{formatRupiah(monthExpense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transaksi terbaru */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          {transactions.length > 0 && (
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Transaksi')}
            >
              Lihat semua
            </Text>
          )}
        </View>

        {recent.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            subtitle="Tekan tombol Tambah untuk mencatat pemasukan atau pengeluaran pertamamu."
          />
        ) : (
          <View style={styles.card}>
            {recent.map((t, i) => (
              <View key={t.id}>
                {i > 0 && <View style={styles.separator} />}
                <TransactionItem
                  transaction={t}
                  showDate
                  dateLabel={labelTanggalRelatif(t.date)}
                  onPress={() =>
                    navigation.navigate('AddTransaction', { transactionId: t.id })
                  }
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Fab onPress={() => navigation.navigate('AddTransaction')} />
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    headerText: { flex: 1 },
    greeting: {
      fontSize: 22,
      fontWeight: '800',
      color: c.text,
    },
    subGreeting: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 2,
    },
    themeBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow,
    },
    balanceCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.primary,
      borderRadius: radius.xl,
      padding: spacing.xl,
      ...shadow,
      shadowColor: c.primary,
      shadowOpacity: 0.3,
      elevation: 6,
    },
    balanceLabel: {
      color: '#DBEAFE',
      fontSize: 14,
      fontWeight: '600',
    },
    balanceValue: {
      color: c.white,
      fontSize: 34,
      fontWeight: '800',
      marginTop: spacing.xs,
    },
    balanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    balanceStat: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: '#ffffff33',
      marginHorizontal: spacing.md,
    },
    statIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#ffffff33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statLabel: {
      color: '#DBEAFE',
      fontSize: 12,
    },
    statValue: {
      color: c.white,
      fontSize: 15,
      fontWeight: '700',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
    },
    link: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    card: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      paddingVertical: spacing.xs,
      ...shadow,
    },
    separator: {
      height: 1,
      backgroundColor: c.border,
      marginLeft: 72,
    },
  });
