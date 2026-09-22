import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Colors, radius, spacing } from '../theme';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
  activeColor?: string;
}

interface Props<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const active = opt.value === value;
        const activeColor = opt.activeColor ?? colors.primary;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && { backgroundColor: activeColor }]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.white : colors.textMuted },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (c: Colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: c.background,
      borderRadius: radius.md,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
    },
  });
