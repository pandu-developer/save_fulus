import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, useReducedMotion } from '@/lib/motion';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Lembar bawah sederhana untuk pilihan cepat (tanpa input teks). */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));

  // Pasang Modal begitu diminta tampil; dilepas setelah animasi keluar selesai.
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: reduced ? 0 : motion.enter,
        easing: motion.easeOut,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: reduced ? 0 : motion.exit,
        easing: motion.easeIn,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress, reduced]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Tutup" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: c.surface,
              paddingBottom: insets.bottom + 12,
              opacity: progress,
              transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
            },
          ]}
        >
          {title ? (
            <View style={styles.header}>
              <Txt variant="heading" accessibilityRole="header" style={styles.title}>
                {title}
              </Txt>
              <IconButton icon="close" label="Tutup" onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    paddingTop: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: gutter,
    paddingRight: gutter - 10,
    paddingBottom: 4,
  },
  title: { flex: 1 },
});
