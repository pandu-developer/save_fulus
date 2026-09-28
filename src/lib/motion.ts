import { useEffect, useState } from 'react';
import { AccessibilityInfo, Easing } from 'react-native';

/** Hormati pengaturan "kurangi gerakan" di perangkat. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduced(v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

// Durasi singkat & bermakna; keluar lebih cepat dari masuk.
export const motion = {
  enter: 220,
  exit: 160,
  progress: 480,
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
};
