import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName, TxType } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';

const SIZES = {
  sm: { box: 32, icon: 16, radius: 9 },
  md: { box: 36, icon: 18, radius: 10 },
  lg: { box: 44, icon: 22, radius: 12 },
} as const;

/** Ikon monokrom dalam kotak redup; pemasukan diberi tint hijau tipis agar mudah dipindai. */
export function CategoryIcon({
  icon,
  type = 'expense',
  size = 'md',
}: {
  icon: IconName;
  type?: TxType;
  size?: keyof typeof SIZES;
}) {
  const { c } = useAppTheme();
  const s = SIZES[size];
  const income = type === 'income';
  return (
    <View
      style={[
        styles.box,
        { width: s.box, height: s.box, borderRadius: s.radius, backgroundColor: income ? c.positiveSoft : c.panel },
      ]}
    >
      <Ionicons name={icon} size={s.icon} color={income ? c.positive : c.ink2} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
