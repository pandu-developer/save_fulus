import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Waktu sekarang yang diperbarui saat layar difokuskan dan tiap menit. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(timer);
    }, []),
  );
  return now;
}
