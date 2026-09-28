import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { motion, useReducedMotion } from '@/lib/motion';
import { useAppTheme } from '@/theme/ThemeProvider';
import { useToastVisible } from './ui/Toast';
import { Txt } from './ui/Txt';

/**
 * Aksi utama, di tengah bawah agar terjangkau jempol kiri maupun kanan.
 * Bergeser naik saat snackbar tampil supaya tidak tertutup.
 */
export function AddButton({ onPress, label = 'Tambah transaksi' }: { onPress: () => void; label?: string }) {
  const { c } = useAppTheme();
  const reduced = useReducedMotion();
  const toastVisible = useToastVisible();
  const [lift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(lift, {
      toValue: toastVisible ? 1 : 0,
      duration: reduced ? 0 : 200,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start();
  }, [lift, toastVisible, reduced]);

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? c.accentPressed : c.accent },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="add" size={22} color={c.onAccent} />
        <Txt weight="semibold" color={c.onAccent}>
          {label}
        </Txt>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  button: {
    height: 52,
    paddingLeft: 18,
    paddingRight: 22,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Satu-satunya bayangan di aplikasi: elemen ini mengambang di atas konten.
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.16)',
  },
  pressed: { transform: [{ scale: 0.98 }] },
});
