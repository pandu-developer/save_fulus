import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { motion, useReducedMotion } from '@/lib/motion';
import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { hairline, radius } from '@/theme/tokens';
import { Txt } from './Txt';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

const PAD = 3;

export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedProps<T>) {
  const { c, isDark } = useAppTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const [pos] = useState(() => new Animated.Value(index));
  const segW = width > 0 ? (width - PAD * 2) / options.length : 0;

  // Indikator bergeser ke pilihan baru — menandai perubahan state, bukan dekorasi.
  useEffect(() => {
    Animated.timing(pos, {
      toValue: index,
      duration: reduced ? 0 : 180,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start();
  }, [index, pos, reduced]);

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: c.panel }]}
    >
      {segW > 0 ? (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: segW,
              backgroundColor: isDark ? c.lineStrong : c.surface,
              borderColor: isDark ? 'transparent' : c.line,
              transform: [{ translateX: Animated.multiply(pos, segW) }],
            },
          ]}
        />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                haptic.tap();
                onChange(o.value);
              }
            }}
            style={styles.segment}
          >
            <Txt variant="label" weight={active ? 'semibold' : 'medium'} tone={active ? 'ink' : 'ink2'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 40,
    borderRadius: radius.md,
    padding: PAD,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.md - 2,
    borderWidth: hairline,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
