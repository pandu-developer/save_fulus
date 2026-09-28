import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { haptic } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { Txt } from './ui/Txt';

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '000' | 'back' | 'clear';

const ROWS: KeypadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['000', '0', 'back'],
];

const MAX_DIGITS = 13;

/** State nominal untuk keypad: angka tanpa nol di depan, maksimal 13 digit. */
export function useAmountInput(initial = 0) {
  const [digits, setDigits] = useState(initial > 0 ? String(Math.round(initial)) : '');
  const press = useCallback((key: KeypadKey) => {
    setDigits((d) => {
      if (key === 'back') return d.slice(0, -1);
      if (key === 'clear') return '';
      const next = (d + key).replace(/^0+/, '');
      return next.length > MAX_DIGITS ? d : next;
    });
  }, []);
  const reset = useCallback((n: number) => setDigits(n > 0 ? String(Math.round(n)) : ''), []);
  return { value: digits ? Number(digits) : 0, press, reset };
}

/** Keypad angka khusus Rupiah — tombol 000 mempercepat input ribuan. */
export function Keypad({ onKey }: { onKey: (key: KeypadKey) => void }) {
  const { c } = useAppTheme();
  const { height } = useWindowDimensions();
  const keyH = height < 720 ? 46 : 54;

  return (
    <View style={styles.grid}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'back' ? 'Hapus satu angka' : key === '000' ? 'Tiga nol' : key}
              accessibilityHint={key === 'back' ? 'Tekan lama untuk menghapus semua' : undefined}
              onPress={() => {
                haptic.tap();
                onKey(key);
              }}
              onLongPress={key === 'back' ? () => onKey('clear') : undefined}
              style={({ pressed }) => [styles.key, { height: keyH }, pressed && { backgroundColor: c.pressed }]}
            >
              {key === 'back' ? (
                <Ionicons name="backspace-outline" size={24} color={c.ink} />
              ) : (
                <Txt variant={key === '000' ? 'heading' : 'title'} weight="medium" tabular>
                  {key}
                </Txt>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 4 },
  row: { flexDirection: 'row', gap: 4 },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
});
