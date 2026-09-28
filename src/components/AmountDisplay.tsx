import { StyleSheet, View } from 'react-native';

import { groupDigits } from '@/lib/format';
import { Txt, type Tone } from './ui/Txt';

/** Nominal sebagai fokus utama: "Rp" kecil & redup, angka besar. */
export function AmountDisplay({
  value,
  tone = 'ink',
  align = 'center',
}: {
  value: number;
  tone?: Tone;
  align?: 'center' | 'left';
}) {
  const empty = value <= 0;
  return (
    <View
      accessible
      accessibilityLabel={empty ? 'Nominal kosong' : `Nominal ${value} rupiah`}
      style={[styles.row, align === 'center' && styles.center]}
    >
      <Txt variant="title" tone="ink3" style={styles.prefix}>
        Rp
      </Txt>
      <Txt
        variant="display"
        tone={empty ? 'ink3' : tone}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        style={styles.value}
      >
        {empty ? '0' : groupDigits(value)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  center: { justifyContent: 'center' },
  prefix: { marginBottom: 2 },
  value: { flexShrink: 1 },
});
