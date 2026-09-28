import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/data/types';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { Sheet } from './ui/Sheet';
import { Txt } from './ui/Txt';

export interface Option {
  id: string;
  label: string;
  icon?: IconName;
  description?: string;
}

interface OptionSheetProps {
  visible: boolean;
  title: string;
  options: Option[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  footer?: ReactNode;
}

/** Daftar pilihan tunggal; pilihan aktif ditandai centang tebal. */
export function OptionSheet({ visible, title, options, selectedId, onSelect, onClose, footer }: OptionSheetProps) {
  const { c } = useAppTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {options.map((o) => {
          const selected = o.id === selectedId;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(o.id)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.pressed }]}
            >
              {o.icon ? <Ionicons name={o.icon} size={20} color={c.ink2} /> : null}
              <View style={styles.text}>
                <Txt weight={selected ? 'semibold' : 'regular'}>{o.label}</Txt>
                {o.description ? (
                  <Txt variant="label" tone="ink2">
                    {o.description}
                  </Txt>
                ) : null}
              </View>
              {selected ? <Ionicons name="checkmark" size={20} color={c.accent} /> : null}
            </Pressable>
          );
        })}
        {footer}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { paddingBottom: 4 },
  row: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: gutter,
    paddingVertical: 10,
  },
  text: { flex: 1 },
});
