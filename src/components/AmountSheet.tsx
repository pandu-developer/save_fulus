import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { gutter } from '@/theme/tokens';
import { AmountDisplay } from './AmountDisplay';
import { Keypad, useAmountInput } from './Keypad';
import { Button } from './ui/Button';
import { Sheet } from './ui/Sheet';
import { Txt } from './ui/Txt';

interface AmountSheetProps {
  visible: boolean;
  title: string;
  helper?: string;
  initial?: number;
  submitLabel?: string;
  allowZero?: boolean;
  onSubmit: (value: number) => void;
  onClose: () => void;
  /** Aksi sekunder, mis. "Hapus budget". */
  secondary?: { label: string; onPress: () => void; destructive?: boolean };
}

export function AmountSheet({
  visible,
  title,
  helper,
  initial = 0,
  submitLabel = 'Simpan',
  allowZero,
  onSubmit,
  onClose,
  secondary,
}: AmountSheetProps) {
  const { value, press, reset } = useAmountInput(initial);
  const [error, setError] = useState<string | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);

  // Setiap kali dibuka, mulai dari nilai awal yang terbaru.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      reset(initial);
      setError(null);
    }
  }

  const submit = () => {
    if (!allowZero && value <= 0) {
      haptic.warn();
      setError('Isi nominalnya dulu.');
      return;
    }
    onSubmit(value);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={styles.body}>
        {helper ? (
          <Txt variant="label" tone="ink2">
            {helper}
          </Txt>
        ) : null}
        <View style={styles.amount}>
          <AmountDisplay value={value} />
          <Txt variant="label" tone="negative" align="center" style={styles.error}>
            {error ?? ' '}
          </Txt>
        </View>
        <Keypad
          onKey={(k) => {
            setError(null);
            press(k);
          }}
        />
        <View style={styles.actions}>
          {secondary ? (
            <Button
              label={secondary.label}
              onPress={secondary.onPress}
              variant={secondary.destructive ? 'danger' : 'secondary'}
              size="lg"
            />
          ) : null}
          <Button label={submitLabel} onPress={submit} size="lg" style={styles.primary} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter, gap: 8 },
  amount: { paddingVertical: 12 },
  error: { marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  primary: { flex: 1 },
});
