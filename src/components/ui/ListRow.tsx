import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { Txt } from './Txt';

interface ListRowProps {
  label: string;
  value?: string;
  description?: string;
  icon?: IconName;
  onPress?: () => void;
  accessory?: ReactNode;
  destructive?: boolean;
  chevron?: boolean;
  accessibilityHint?: string;
}

/** Baris pengaturan/daftar yang datar — bukan kartu. */
export function ListRow({
  label,
  value,
  description,
  icon,
  onPress,
  accessory,
  destructive,
  chevron = !!onPress && !accessory,
  accessibilityHint,
}: ListRowProps) {
  const { c } = useAppTheme();
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={20} color={destructive ? c.negative : c.ink2} /> : null}
      <View style={styles.text}>
        <Txt weight="medium" tone={destructive ? 'negative' : 'ink'}>
          {label}
        </Txt>
        {description ? (
          <Txt variant="label" tone="ink2" style={styles.desc}>
            {description}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt tone="ink2" numberOfLines={1} style={styles.value}>
          {value}
        </Txt>
      ) : null}
      {accessory}
      {chevron ? <Ionicons name="chevron-forward" size={16} color={c.ink3} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: gutter,
    paddingVertical: 12,
  },
  text: { flex: 1 },
  desc: { marginTop: 2 },
  value: { maxWidth: '50%' },
});
