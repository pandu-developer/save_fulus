import { memo, useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useStore } from '@/data/store';
import type { Category, PaymentMethod, Transaction } from '@/data/types';
import { formatTime } from '@/lib/date';
import { useReducedMotion } from '@/lib/motion';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { CategoryIcon } from './CategoryIcon';
import { Money } from './ui/Money';
import { Txt } from './ui/Txt';

interface Props {
  tx: Transaction;
  category: Category;
  method?: PaymentMethod;
  onPress: (tx: Transaction) => void;
  /** Ganti jam dengan tanggal pendek (untuk transaksi di luar hari ini pada daftar lintas hari). */
  dateLabel?: string;
}

function TransactionRowBase({ tx, category, method, onPress, dateLabel }: Props) {
  const { c } = useAppTheme();
  const reduced = useReducedMotion();
  const title = tx.note.trim() || category.label;
  const time = formatTime(new Date(tx.date));
  const meta = [dateLabel ?? time, title !== category.label ? category.label : null, method?.label]
    .filter(Boolean)
    .join(' · ');

  // Transaksi yang baru disimpan muncul dengan animasi halus + sorotan singkat.
  // Status "baru" dikunci saat mount agar animasi tidak terulang saat render ulang.
  const flashed = useStore((s) => s.flashId === tx.id);
  const [isNew] = useState(flashed);
  const [enter] = useState(() => new Animated.Value(isNew ? 0 : 1));
  const [glow] = useState(() => new Animated.Value(isNew ? 1 : 0));

  useEffect(() => {
    if (!isNew) return;
    if (reduced) {
      enter.setValue(1);
      glow.setValue(0);
      return;
    }
    Animated.timing(enter, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    Animated.timing(glow, { toValue: 0, duration: 1400, delay: 300, useNativeDriver: false }).start();
  }, [isNew, reduced, enter, glow]);

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        backgroundColor: glow.interpolate({ inputRange: [0, 1], outputRange: ['transparent', c.accentSoft] }),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${tx.type === 'income' ? 'pemasukan' : 'pengeluaran'} ${tx.amount} rupiah, ${meta}`}
        accessibilityHint="Buka untuk mengubah"
        onPress={() => onPress(tx)}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
      >
        <CategoryIcon icon={category.icon} type={tx.type} />
        <View style={styles.middle}>
          <Txt weight="medium" numberOfLines={1}>
            {title}
          </Txt>
          <Txt variant="label" tone="ink2" numberOfLines={1} style={styles.meta}>
            {meta}
          </Txt>
        </View>
        <Money amount={tx.amount} type={tx.type} weight="semibold" tabular />
      </Pressable>
    </Animated.View>
  );
}

export const TransactionRow = memo(TransactionRowBase);

export const ROW_INSET = gutter + 36 + 12;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: gutter,
    paddingVertical: 11,
  },
  middle: { flex: 1 },
  meta: { marginTop: 2 },
});
