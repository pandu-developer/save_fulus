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

import { useGoals } from '../context/GoalsContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatInputAngka, formatRupiah, parseAngka } from '../utils/format';
import { formatTanggal } from '../utils/date';
import { isCompleted, progress, remaining, savedAmount } from '../utils/goals';

const QUICK = [50000, 100000, 250000, 500000];

export default function GoalDetailScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'GoalDetail'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { getGoalById, addEntry, deleteEntry } = useGoals();

  const goal = getGoalById(route.params.goalId);
  const [nabungText, setNabungText] = useState('');

  // Impian mungkin sudah dihapus
  if (!goal) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text style={styles.missing}>Impian tidak ditemukan.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const saved = savedAmount(goal);
  const prog = progress(goal);
  const done = isCompleted(goal);
  const sisa = remaining(goal);
  const history = [...goal.entries].reverse();

  function tabung(amount: number) {
    if (!goal || amount <= 0) return;
    const before = savedAmount(goal);
    addEntry(goal.id, amount);
    if (before < goal.targetAmount && before + amount >= goal.targetAmount) {
      Alert.alert('Selamat! 🎉', `Impian "${goal.name}" sudah tercapai!`);
    }
  }

  function handleTabung() {
    const amount = parseAngka(nabungText);
    if (amount <= 0) {
      Alert.alert('Nominal belum diisi', 'Masukkan nominal tabungan lebih dari 0.');
      return;
    }
    tabung(amount);
    setNabungText('');
  }

  function handleDeleteEntry(entryId: string) {
    if (!goal) return;
    Alert.alert('Hapus riwayat ini?', 'Nominal akan dikurangi dari tabungan.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteEntry(goal.id, entryId),
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {goal.name}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('AddGoal', { goalId: goal.id })}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Kartu progres */}
        <View style={styles.progressCard}>
          <View style={[styles.bigIcon, { backgroundColor: goal.color }]}>
            <Ionicons name={goal.icon as any} size={34} color={colors.white} />
          </View>
          <Text style={styles.savedValue}>{formatRupiah(saved)}</Text>
          <Text style={styles.targetValue}>dari {formatRupiah(goal.targetAmount)}</Text>

          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max(prog * 100, 2)}%`, backgroundColor: goal.color },
              ]}
            />
          </View>

          <View style={styles.progFoot}>
            <Text style={[styles.pct, { color: goal.color }]}>
              {Math.round(prog * 100)}%
            </Text>
            <Text style={styles.sisa}>
              {done ? '🎉 Tercapai!' : `Kurang ${formatRupiah(sisa)}`}
            </Text>
          </View>
        </View>

        {/* Nabung */}
        <Text style={styles.sectionLabel}>Nabung Sekarang</Text>
        <View style={styles.nabungRow}>
          <View style={styles.nabungInputWrap}>
            <Text style={[styles.rp, { color: colors.text }]}>Rp</Text>
            <TextInput
              value={nabungText}
              onChangeText={(t) => setNabungText(formatInputAngka(t))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textLight}
              style={styles.nabungInput}
              maxLength={15}
            />
          </View>
          <Pressable
            onPress={handleTabung}
            style={({ pressed }) => [
              styles.tabungBtn,
              { backgroundColor: goal.color },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.tabungText}>Tabung</Text>
          </Pressable>
        </View>

        <View style={styles.quickRow}>
          {QUICK.map((q) => (
            <Pressable key={q} style={styles.quickBtn} onPress={() => tabung(q)}>
              <Text style={styles.quickText}>
                +{q >= 1000 ? `${q / 1000}rb` : q}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Riwayat */}
        <Text style={styles.sectionLabel}>Riwayat Menabung</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>
            Belum ada tabungan. Mulai menabung untuk impianmu! 💪
          </Text>
        ) : (
          <View style={styles.historyCard}>
            {history.map((e, i) => (
              <View key={e.id}>
                {i > 0 && <View style={styles.separator} />}
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: (e.amount >= 0 ? colors.income : colors.expense) + '1A' },
                    ]}
                  >
                    <Ionicons
                      name={e.amount >= 0 ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={e.amount >= 0 ? colors.income : colors.expense}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyAmount}>
                      {e.amount >= 0 ? '+' : '-'}
                      {formatRupiah(Math.abs(e.amount))}
                    </Text>
                    <Text style={styles.historyDate}>{formatTanggal(e.date)}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteEntry(e.id)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color={colors.textLight} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: c.background },
    center: { alignItems: 'center', justifyContent: 'center' },
    missing: { color: c.textMuted, fontSize: 15, marginBottom: spacing.md },
    backBtn: {
      backgroundColor: c.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
    },
    backText: { color: c.white, fontWeight: '700' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: c.card,
      gap: spacing.sm,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
    },
    progressCard: {
      margin: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      ...shadow,
    },
    bigIcon: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    savedValue: {
      fontSize: 30,
      fontWeight: '800',
      color: c.text,
    },
    targetValue: {
      fontSize: 14,
      color: c.textMuted,
      marginTop: 2,
      marginBottom: spacing.lg,
    },
    track: {
      width: '100%',
      height: 12,
      borderRadius: 6,
      backgroundColor: c.background,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: 6,
    },
    progFoot: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    pct: {
      fontSize: 16,
      fontWeight: '800',
    },
    sisa: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    nabungRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
    },
    nabungInputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.card,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
    },
    rp: {
      fontSize: 18,
      fontWeight: '800',
    },
    nabungInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      paddingVertical: spacing.md,
    },
    tabungBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      justifyContent: 'center',
    },
    tabungText: {
      color: c.white,
      fontSize: 15,
      fontWeight: '800',
    },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    quickBtn: {
      flex: 1,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      alignItems: 'center',
    },
    quickText: {
      fontSize: 13,
      fontWeight: '700',
      color: c.text,
    },
    emptyHistory: {
      color: c.textMuted,
      fontSize: 14,
      marginHorizontal: spacing.lg,
      marginTop: spacing.xs,
      lineHeight: 20,
    },
    historyCard: {
      marginHorizontal: spacing.lg,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      paddingVertical: spacing.xs,
      ...shadow,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    historyIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: c.text,
    },
    historyDate: {
      fontSize: 12,
      color: c.textMuted,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: c.border,
      marginLeft: 64,
    },
  });
