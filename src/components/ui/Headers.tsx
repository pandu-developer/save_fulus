import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Txt } from './Txt';

/** Judul besar untuk layar tab. */
export function ScreenHeader({
  title,
  eyebrow,
  subtitle,
  right,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenText}>
        {eyebrow ? (
          <Txt variant="label" tone="ink2">
            {eyebrow}
          </Txt>
        ) : null}
        <Txt variant="title" accessibilityRole="header" numberOfLines={2}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="label" tone="ink2" style={styles.subtitle}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Header ringkas untuk layar tumpuk/modal. */
export function StackHeader({
  title,
  onBack,
  icon = 'arrow-back',
  right,
}: {
  title: string;
  onBack: () => void;
  icon?: 'arrow-back' | 'close';
  right?: ReactNode;
}) {
  const { c } = useAppTheme();
  return (
    <View style={styles.stack}>
      <IconButton icon={icon} label={icon === 'close' ? 'Tutup' : 'Kembali'} onPress={onBack} color={c.ink} />
      <Txt variant="heading" numberOfLines={1} accessibilityRole="header" style={styles.stackTitle}>
        {title}
      </Txt>
      <View style={styles.stackRight}>{right}</View>
    </View>
  );
}

/** Judul bagian dalam halaman, dengan aksi atau keterangan di kanan. */
export function SectionTitle({
  title,
  meta,
  action,
  first,
}: {
  title: string;
  meta?: string;
  action?: { label: string; onPress: () => void };
  first?: boolean;
}) {
  const { c } = useAppTheme();
  return (
    <View style={[styles.section, first && styles.sectionFirst]}>
      <Txt variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Txt>
      {meta ? (
        <Txt variant="label" tone="ink2">
          {meta}
        </Txt>
      ) : null}
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Txt variant="label" weight="semibold" color={c.accent}>
            {action.label}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: gutter,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  screenText: { flex: 1 },
  subtitle: { marginTop: 2 },
  stack: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: gutter - 10,
    gap: 4,
  },
  stackTitle: { flex: 1 },
  stackRight: { minWidth: 40, alignItems: 'flex-end' },
  section: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: gutter,
    paddingTop: 28,
    paddingBottom: 10,
    gap: 12,
  },
  sectionFirst: { paddingTop: 12 },
  sectionTitle: { flex: 1 },
});
