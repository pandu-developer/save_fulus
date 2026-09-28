import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { font, typeScale, type FontWeightName, type Palette, type TypeVariant } from '@/theme/tokens';

export type Tone = keyof Pick<
  Palette,
  'ink' | 'ink2' | 'ink3' | 'accent' | 'positive' | 'negative' | 'warning' | 'onAccent'
>;

export interface TxtProps extends TextProps {
  variant?: TypeVariant;
  tone?: Tone;
  weight?: FontWeightName;
  /** Angka lebar-sama — hanya untuk kolom angka yang harus rata. */
  tabular?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

export function Txt({
  variant = 'body',
  tone = 'ink',
  weight,
  tabular,
  align,
  color,
  style,
  ...rest
}: TxtProps) {
  const { c } = useAppTheme();
  return (
    <Text
      maxFontSizeMultiplier={1.35}
      {...rest}
      style={[
        typeScale[variant],
        weight && { fontFamily: font[weight] },
        { color: color ?? c[tone] },
        tabular && styles.tabular,
        align && { textAlign: align },
        styles.base,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  // Font custom di Android membawa padding ekstra yang membuat teks tidak simetris.
  base: Platform.OS === 'android' ? { includeFontPadding: false } : {},
  tabular: { fontVariant: ['tabular-nums'] },
});
