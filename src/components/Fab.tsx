import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Colors, radius, shadow, spacing } from '../theme';

interface Props {
  onPress: () => void;
  label?: string;
}

export function Fab({ onPress, label = 'Tambah' }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
    >
      <Ionicons name="add" size={24} color={colors.white} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    fab: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: c.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      ...shadow,
      shadowColor: c.primary,
      shadowOpacity: 0.25,
      elevation: 6,
    },
    pressed: {
      backgroundColor: c.primaryDark,
      transform: [{ scale: 0.97 }],
    },
    label: {
      color: c.white,
      fontSize: 15,
      fontWeight: '700',
    },
  });
