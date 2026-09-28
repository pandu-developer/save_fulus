import { Pressable, StyleSheet, View } from 'react-native';

import type { IconName } from '@/data/types';
import { percent, rupiah } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { CategoryIcon } from '../CategoryIcon';
import { Txt } from '../ui/Txt';

export interface RankedItem {
  id: string;
  label: string;
  icon: IconName;
  value: number;
}

/**
 * Porsi per kategori sebagai daftar berperingkat dengan bar satu warna —
 * lebih mudah dibaca daripada donut dan tidak butuh banyak warna.
 */
export function RankedBars({
  items,
  total,
  onPressItem,
}: {
  items: RankedItem[];
  total: number;
  onPressItem?: (id: string) => void;
}) {
  const { c } = useAppTheme();
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View>
      {items.map((item) => {
        const share = total > 0 ? item.value / total : 0;
        return (
          <Pressable
            key={item.id}
            disabled={!onPressItem}
            accessibilityRole={onPressItem ? 'button' : undefined}
            accessibilityLabel={`${item.label}, ${rupiah(item.value)}, ${percent(share)} dari total`}
            accessibilityHint={onPressItem ? 'Lihat transaksinya' : undefined}
            onPress={() => onPressItem?.(item.id)}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
          >
            <CategoryIcon icon={item.icon} size="sm" />
            <View style={styles.body}>
              <View style={styles.top}>
                <Txt weight="medium" numberOfLines={1} style={styles.label}>
                  {item.label}
                </Txt>
                <Txt weight="semibold" tabular>
                  {rupiah(item.value)}
                </Txt>
                <Txt variant="label" tone="ink2" tabular align="right" style={styles.pct}>
                  {percent(share)}
                </Txt>
              </View>
              <View style={[styles.track, { backgroundColor: c.accentSoft }]}>
                <View style={[styles.fill, { backgroundColor: c.accent, width: `${(item.value / max) * 100}%` }]} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: gutter, paddingVertical: 10 },
  body: { flex: 1, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  label: { flex: 1 },
  pct: { width: 38 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
