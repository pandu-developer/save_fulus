import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { hairline, radius } from '@/theme/tokens';
import { Txt } from './Txt';

interface ChipProps {
  label: string;
  onPress: () => void;
  /** Pilihan yang sedang dipilih (mis. kategori di form). */
  selected?: boolean;
  /** Filter yang sedang aktif (nilai non-default). */
  active?: boolean;
  icon?: IconName;
  trailingIcon?: IconName;
  accessibilityLabel?: string;
}

export function Chip({ label, onPress, selected, active, icon, trailingIcon, accessibilityLabel }: ChipProps) {
  const { c } = useAppTheme();
  const fg = selected ? c.onAccent : active ? c.accent : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.base,
        selected
          ? { backgroundColor: pressed ? c.accentPressed : c.accent, borderColor: c.accent }
          : active
            ? { backgroundColor: c.accentSoft, borderColor: c.accentSoft }
            : { backgroundColor: pressed ? c.pressed : 'transparent', borderColor: c.lineStrong },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={selected ? c.onAccent : active ? c.accent : c.ink2} /> : null}
      <Txt variant="label" color={fg} numberOfLines={1}>
        {label}
      </Txt>
      {trailingIcon ? <Ionicons name={trailingIcon} size={14} color={selected ? c.onAccent : active ? c.accent : c.ink3} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: hairline * 2,
  },
});
