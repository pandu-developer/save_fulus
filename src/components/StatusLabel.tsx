import { StyleSheet, View } from 'react-native';

import { STATUS_LABEL, type BudgetStatus } from '@/data/selectors';
import { useAppTheme } from '@/theme/ThemeProvider';
import { Txt } from './ui/Txt';

/** Status budget: titik berwarna + teks, sehingga tidak bergantung pada warna saja. */
export function StatusLabel({ status }: { status: BudgetStatus }) {
  const { c } = useAppTheme();
  const dot = status === 'over' ? c.negative : status === 'near' ? c.warningMark : c.positive;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Txt
        variant="label"
        weight={status === 'ok' ? 'medium' : 'semibold'}
        tone={status === 'over' ? 'negative' : status === 'near' ? 'warning' : 'ink2'}
      >
        {STATUS_LABEL[status]}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
