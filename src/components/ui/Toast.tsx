import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, useReducedMotion } from '@/lib/motion';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';
import { Txt } from './Txt';

export interface ToastOptions {
  message: string;
  action?: { label: string; onPress: () => void };
  duration?: number;
}

type ToastItem = ToastOptions & { key: number };

const ShowContext = createContext<(opts: ToastOptions) => void>(() => {});
const VisibleContext = createContext(false);

export function useToast() {
  return useContext(ShowContext);
}

/** Dipakai tombol Tambah agar bergeser naik saat toast tampil. */
export function useToastVisible() {
  return useContext(VisibleContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const show = useCallback((opts: ToastOptions) => setToast({ ...opts, key: Date.now() }), []);
  const done = useCallback(() => setToast(null), []);
  return (
    <ShowContext.Provider value={show}>
      <VisibleContext.Provider value={toast !== null}>
        {children}
        {toast ? <ToastView key={toast.key} toast={toast} onDone={done} /> : null}
      </VisibleContext.Provider>
    </ShowContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  const { c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduced ? 0 : motion.exit,
      easing: motion.easeIn,
      useNativeDriver: true,
    }).start(() => onDone());
  }, [onDone, progress, reduced]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : motion.enter,
      easing: motion.easeOut,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(close, toast.duration ?? (toast.action ? 4500 : 2600));
    return () => clearTimeout(timer);
  }, [close, progress, reduced, toast.action, toast.duration]);

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + 68,
          backgroundColor: c.toastBg,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <Txt variant="label" color={c.toastText} style={styles.message} numberOfLines={2}>
        {toast.message}
      </Txt>
      {toast.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            toast.action?.onPress();
            close();
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
        >
          <Txt variant="label" weight="semibold" color={c.toastAction}>
            {toast.action.label}
          </Txt>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: gutter,
    right: gutter,
    minHeight: 48,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  message: { flex: 1 },
  action: { paddingVertical: 2 },
});
