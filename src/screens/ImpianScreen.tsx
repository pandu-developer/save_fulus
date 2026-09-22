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

import { useGoals } from '../context/GoalsContext';
import { useTheme } from '../context/ThemeContext';
import { TabScreenNavigationProp } from '../navigation/types';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatRupiah } from '../utils/format';
import { isCompleted, progress, remaining, savedAmount } from '../utils/goals';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';

export default function ImpianScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { goals, loading } = useGoals();

  const { totalSaved, totalTarget } = useMemo(() => {
    let s = 0;
    let t = 0;
    for (const g of goals) {
      s += savedAmount(g);
      t += g.targetAmount;
    }
    return { totalSaved: s, totalTarget: t };
  }, [goals]);

  const overall = totalTarget > 0 ? Math.min(totalSaved / totalTarget, 1) : 0;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.headerBar, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Impian</Text>
        <Text style={styles.subtitle}>Barang yang ingin kamu beli</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl * 2.5 }}
        showsVerticalScrollIndicator={false}
      >
        {goals.length > 0 && (
          <View style={styles.overallCard}>
            <View style={styles.overallTop}>
              <View style={styles.overallIcon}>
                <Ionicons name="sparkles" size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.overallLabel}>Total Terkumpul</Text>
                <Text style={styles.overallValue}>{formatRupiah(totalSaved)}</Text>
              </View>
              <Text style={styles.overallPct}>{Math.round(overall * 100)}%</Text>
            </View>
            <View style={styles.overallTrack}>
              <View style={[styles.overallFill, { width: `${overall * 100}%` }]} />
            </View>
            <Text style={styles.overallTarget}>
              dari total target {formatRupiah(totalTarget)}
            </Text>
          </View>
        )}

        {goals.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="Belum ada impian"
            subtitle="Tambahkan barang impianmu, tentukan targetnya, lalu mulai menabung sedikit demi sedikit."
          />
        ) : (
          goals.map((g) => {
            const saved = savedAmount(g);
            const prog = progress(g);
            const done = isCompleted(g);
            const sisa = remaining(g);
            return (
              <Pressable
                key={g.id}
                style={styles.card}
                onPress={() => navigation.navigate('GoalDetail', { goalId: g.id })}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.cardIcon, { backgroundColor: g.color + '1A' }]}>
                    <Ionicons name={g.icon as any} size={24} color={g.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <Text style={styles.cardSub}>
                      {formatRupiah(saved)} / {formatRupiah(g.targetAmount)}
                    </Text>
                  </View>
                  {done ? (
                    <View style={styles.doneBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.income} />
                      <Text style={styles.doneText}>Tercapai</Text>
                    </View>
                  ) : (
                    <Text style={[styles.cardPct, { color: g.color }]}>
                      {Math.round(prog * 100)}%
                    </Text>
                  )}
                </View>

                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${Math.max(prog * 100, 2)}%`, backgroundColor: g.color },
                    ]}
                  />
                </View>

                <Text style={styles.cardFoot}>
                  {done ? '🎉 Impian tercapai!' : `Kurang ${formatRupiah(sisa)} lagi`}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Fab label="Impian" onPress={() => navigation.navigate('AddGoal')} />
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
    subtitle: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 2,
    },
    overallCard: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...shadow,
      shadowColor: c.primary,
      shadowOpacity: 0.3,
      elevation: 6,
    },
    overallTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    overallIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#ffffff33',
      alignItems: 'center',
      justifyContent: 'center',
    },
    overallLabel: { color: '#DBEAFE', fontSize: 13 },
    overallValue: {
      color: c.white,
      fontSize: 22,
      fontWeight: '800',
      marginTop: 2,
    },
    overallPct: { color: c.white, fontSize: 18, fontWeight: '800' },
    overallTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ffffff33',
      overflow: 'hidden',
      marginTop: spacing.md,
    },
    overallFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: c.white,
    },
    overallTarget: {
      color: '#DBEAFE',
      fontSize: 12,
      marginTop: spacing.sm,
    },
    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...shadow,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    cardSub: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 2,
    },
    cardPct: {
      fontSize: 16,
      fontWeight: '800',
    },
    doneBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: c.incomeSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    doneText: {
      color: c.income,
      fontSize: 12,
      fontWeight: '700',
    },
    track: {
      height: 10,
      borderRadius: 5,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 5,
    },
    cardFoot: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: spacing.sm,
      fontWeight: '600',
    },
  });
