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
import { GOAL_COLORS, GOAL_ICONS } from '../constants/goals';
import { Colors, radius, shadow, spacing } from '../theme';
import { formatAngka, formatInputAngka, parseAngka } from '../utils/format';

export default function AddGoalScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddGoal'>>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { addGoal, updateGoal, deleteGoal, getGoalById } = useGoals();

  const editId = route.params?.goalId;
  const existing = editId ? getGoalById(editId) : undefined;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [targetText, setTargetText] = useState(
    existing ? formatAngka(existing.targetAmount) : '',
  );
  const [icon, setIcon] = useState(existing?.icon ?? GOAL_ICONS[0]);
  const [color, setColor] = useState(existing?.color ?? GOAL_COLORS[0]);
  const [startText, setStartText] = useState('');

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nama impian belum diisi', 'Beri nama impianmu, mis. "iPhone 15".');
      return;
    }
    const target = parseAngka(targetText);
    if (target <= 0) {
      Alert.alert('Target belum diisi', 'Masukkan harga/target lebih dari 0.');
      return;
    }

    if (existing) {
      updateGoal(existing.id, { name: trimmed, targetAmount: target, icon, color });
    } else {
      const start = parseAngka(startText);
      addGoal({
        name: trimmed,
        targetAmount: target,
        icon,
        color,
        entries:
          start > 0
            ? [{ id: `${Date.now()}`, amount: start, date: new Date().toISOString() }]
            : [],
      });
    }
    navigation.goBack();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Hapus impian?', `"${existing.name}" akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteGoal(existing.id);
          // kembali ke daftar impian (lewati layar detail jika ada)
          navigation.navigate('Main', { screen: 'Impian' });
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
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Impian' : 'Impian Baru'}
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
        {/* Pratinjau */}
        <View style={styles.preview}>
          <View style={[styles.previewIcon, { backgroundColor: color }]}>
            <Ionicons name={icon as any} size={34} color={colors.white} />
          </View>
          <Text style={styles.previewName} numberOfLines={1}>
            {name.trim() || 'Nama impian'}
          </Text>
        </View>

        {/* Nama */}
        <Text style={styles.sectionLabel}>Nama Impian</Text>
        <View style={styles.fieldRow}>
          <Ionicons name="pricetag-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="mis. iPhone 15, Motor, Liburan Bali"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            maxLength={40}
          />
        </View>

        {/* Target */}
        <Text style={styles.sectionLabel}>Target Harga</Text>
        <View style={styles.fieldRow}>
          <Text style={[styles.rp, { color: colors.text }]}>Rp</Text>
          <TextInput
            value={targetText}
            onChangeText={(t) => setTargetText(formatInputAngka(t))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            maxLength={15}
          />
        </View>

        {/* Sudah terkumpul (hanya saat membuat baru) */}
        {!isEditing && (
          <>
            <Text style={styles.sectionLabel}>Sudah Terkumpul (opsional)</Text>
            <View style={styles.fieldRow}>
              <Text style={[styles.rp, { color: colors.text }]}>Rp</Text>
              <TextInput
                value={startText}
                onChangeText={(t) => setStartText(formatInputAngka(t))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textLight}
                style={styles.input}
                maxLength={15}
              />
            </View>
          </>
        )}

        {/* Ikon */}
        <Text style={styles.sectionLabel}>Ikon</Text>
        <View style={styles.iconGrid}>
          {GOAL_ICONS.map((ic) => {
            const selected = ic === icon;
            return (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={styles.iconItem}
              >
                <View
                  style={[
                    styles.iconCircle,
                    selected
                      ? { backgroundColor: color }
                      : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name={ic as any}
                    size={24}
                    color={selected ? colors.white : colors.textMuted}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Warna */}
        <Text style={styles.sectionLabel}>Warna</Text>
        <View style={styles.colorRow}>
          {GOAL_COLORS.map((col) => {
            const selected = col === color;
            return (
              <Pressable key={col} onPress={() => setColor(col)}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: col },
                    selected && styles.colorSelected,
                  ]}
                >
                  {selected && <Ionicons name="checkmark" size={18} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Simpan */}
      <View style={[styles.saveBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.saveText}>
            {isEditing ? 'Simpan Perubahan' : 'Simpan Impian'}
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
    preview: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    previewIcon: {
      width: 76,
      height: 76,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    previewName: {
      fontSize: 18,
      fontWeight: '800',
      color: c.text,
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textMuted,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
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
    rp: {
      fontSize: 18,
      fontWeight: '800',
    },
    input: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: c.text,
      padding: 0,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.md,
    },
    iconItem: {
      width: '25%',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    iconCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorSelected: {
      borderWidth: 3,
      borderColor: c.card,
      // ring effect via shadow
      ...shadow,
      elevation: 3,
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
