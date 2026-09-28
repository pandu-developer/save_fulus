import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHT: Record<Size, number> = { lg: 52, md: 44, sm: 36 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  style,
  accessibilityHint,
}: ButtonProps) {
  const { c } = useAppTheme();
  const fg =
    variant === 'primary' ? c.onAccent : variant === 'danger' ? c.negative : variant === 'ghost' ? c.accent : c.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={size === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        { height: HEIGHT[size], paddingHorizontal: size === 'sm' ? 12 : 18 },
        variant === 'primary' && { backgroundColor: pressed ? c.accentPressed : c.accent },
        variant === 'secondary' && { backgroundColor: pressed ? c.pressed : c.panel },
        (variant === 'ghost' || variant === 'danger') && {
          backgroundColor: pressed ? c.pressed : 'transparent',
        },
        pressed && variant === 'primary' && styles.pressedPrimary,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} /> : null}
      <Txt variant={size === 'sm' ? 'label' : 'body'} weight="semibold" color={fg} numberOfLines={1}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
  },
  pressedPrimary: { transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.4 },
});
