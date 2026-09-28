import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { Txt } from './ui/Txt';

interface FieldRowProps {
  icon: IconName;
  label: string;
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  children?: ReactNode; // mis. TextInput
  error?: boolean;
}

/** Baris formulir: ikon, label tetap terlihat, lalu nilai atau input. */
export function FieldRow({ icon, label, value, placeholder, onPress, children, error }: FieldRowProps) {
  const { c } = useAppTheme();
  const body = (
    <>
      <Ionicons name={icon} size={18} color={error ? c.negative : c.ink3} />
      <Txt variant="label" tone={error ? 'negative' : 'ink2'} style={styles.label}>
        {label}
      </Txt>
      <View style={styles.value}>
        {children ?? (
          <Txt tone={value ? 'ink' : 'ink3'} numberOfLines={1} align="right">
            {value || placeholder}
          </Txt>
        )}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={c.ink3} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || placeholder || ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: gutter,
  },
  label: { width: 76 },
  value: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
});
