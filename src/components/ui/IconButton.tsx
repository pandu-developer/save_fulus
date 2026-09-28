import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';

interface IconButtonProps {
  icon: IconName;
  label: string; // wajib: tombol ikon tanpa teks butuh label aksesibilitas
  onPress: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, label, onPress, color, size = 22, style }: IconButtonProps) {
  const { c } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.base, pressed && { backgroundColor: c.pressed }, style]}
    >
      <Ionicons name={icon} size={size} color={color ?? c.ink2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
