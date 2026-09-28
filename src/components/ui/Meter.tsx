import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { BudgetStatus } from '@/data/selectors';
import { motion, useReducedMotion } from '@/lib/motion';
import { useAppTheme } from '@/theme/ThemeProvider';

interface MeterProps {
  ratio: number; // 0..∞ — di atas 1 berarti lewat batas
  status?: BudgetStatus;
  /** Posisi "hari ini" dalam bulan (0..1): pembanding kecepatan pemakaian. */
  pace?: number;
  height?: number;
  accessibilityLabel?: string;
}

/**
 * Meter satu warna: isi membawa tingkat (aksen → peringatan → bahaya),
 * track memakai tint dari warna yang sama.
 */
export function Meter({ ratio, status = 'ok', pace, height = 6, accessibilityLabel }: MeterProps) {
  const { c } = useAppTheme();
  const reduced = useReducedMotion();
  const target = Math.min(Math.max(ratio, 0), 1);
  const [anim] = useState(() => new Animated.Value(0));

  // Progres bergerak halus ke nilai baru saat data berubah.
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: reduced ? 0 : motion.progress,
      easing: motion.easeOut,
      useNativeDriver: false,
    }).start();
  }, [anim, target, reduced]);

  const fill = status === 'over' ? c.negative : status === 'near' ? c.warningMark : c.accent;
  const track = status === 'over' ? c.negativeSoft : status === 'near' ? c.warningSoft : c.accentSoft;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(ratio, 1) * 100) }}
      style={styles.wrap}
    >
      <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              borderRadius: height / 2,
              backgroundColor: fill,
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      {pace !== undefined && pace > 0 && pace < 1 ? (
        <View style={[styles.pace, { left: `${pace * 100}%`, top: -3, height: height + 6, backgroundColor: c.ink2 }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
  pace: { position: 'absolute', width: 2, marginLeft: -1, borderRadius: 1, pointerEvents: 'none' },
});
