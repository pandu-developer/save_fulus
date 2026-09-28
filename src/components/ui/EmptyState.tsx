import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { Button } from './Button';
import { Txt } from './Txt';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  secondary?: { label: string; onPress: () => void };
}

/** Kalimat yang manusiawi + satu langkah jelas berikutnya. */
export function EmptyState({ icon, title, body, action, secondary }: EmptyStateProps) {
  const { c } = useAppTheme();
  return (
    <View style={styles.wrap}>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: c.panel }]}>
          <Ionicons name={icon} size={22} color={c.ink2} />
        </View>
      ) : null}
      <Txt variant="heading">{title}</Txt>
      {body ? (
        <Txt tone="ink2" style={styles.body}>
          {body}
        </Txt>
      ) : null}
      {action || secondary ? (
        <View style={styles.actions}>
          {action ? <Button label={action.label} onPress={action.onPress} size="md" /> : null}
          {secondary ? (
            <Button label={secondary.label} onPress={secondary.onPress} variant="ghost" size="md" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: gutter, paddingVertical: 28 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  body: { marginTop: 6, maxWidth: 340 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
});
