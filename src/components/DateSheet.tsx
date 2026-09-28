import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  addDays,
  currentMonth,
  daysInMonth,
  formatMonth,
  isSameDay,
  sameMonth,
  shiftMonth,
  startOfDay,
  type YearMonth,
} from '@/lib/date';
import { useAppTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';
import { Chip } from './ui/Chip';
import { IconButton } from './ui/IconButton';
import { Sheet } from './ui/Sheet';
import { Txt } from './ui/Txt';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

interface DateSheetProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

/** Pilih tanggal: pilihan cepat dulu, kalender untuk sisanya. Tanggal masa depan dinonaktifkan. */
export function DateSheet({ visible, value, onChange, onClose }: DateSheetProps) {
  const { c } = useAppTheme();
  const today = startOfDay(new Date());
  const [month, setMonth] = useState<YearMonth>({ y: value.getFullYear(), m: value.getMonth() });
  const [wasVisible, setWasVisible] = useState(visible);

  // Saat dibuka, kalender menampilkan bulan dari tanggal yang sedang dipilih.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setMonth({ y: value.getFullYear(), m: value.getMonth() });
  }

  // Pertahankan jam & menit dari nilai lama.
  const choose = (day: Date) => {
    const d = new Date(day);
    d.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(d);
    onClose();
  };

  const cells = useMemo(() => {
    const first = new Date(month.y, month.m, 1);
    const lead = (first.getDay() + 6) % 7; // kolom Senin = 0
    const total = daysInMonth(month.y, month.m);
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= total; d++) out.push(new Date(month.y, month.m, d));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const isCurrentMonth = sameMonth(month, currentMonth());
  const quick = [
    { label: 'Hari ini', date: today },
    { label: 'Kemarin', date: addDays(today, -1) },
    { label: '2 hari lalu', date: addDays(today, -2) },
  ];

  return (
    <Sheet visible={visible} onClose={onClose} title="Tanggal">
      <View style={styles.body}>
        <View style={styles.quick}>
          {quick.map((q) => (
            <Chip key={q.label} label={q.label} selected={isSameDay(q.date, value)} onPress={() => choose(q.date)} />
          ))}
        </View>

        <View style={styles.monthRow}>
          <IconButton icon="chevron-back" label="Bulan sebelumnya" onPress={() => setMonth((m) => shiftMonth(m, -1))} />
          <Txt weight="semibold" style={styles.monthLabel} align="center">
            {formatMonth(month)}
          </Txt>
          <IconButton
            icon="chevron-forward"
            label="Bulan berikutnya"
            onPress={() => setMonth((m) => shiftMonth(m, 1))}
            color={isCurrentMonth ? c.line : undefined}
            style={isCurrentMonth ? styles.hidden : undefined}
          />
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((w) => (
            <Txt key={w} variant="micro" tone="ink3" align="center" style={styles.cell}>
              {w}
            </Txt>
          ))}
        </View>
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const future = d.getTime() > today.getTime();
            const selected = isSameDay(d, value);
            const isToday = isSameDay(d, today);
            return (
              <Pressable
                key={d.getTime()}
                disabled={future}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: future }}
                accessibilityLabel={`${d.getDate()} ${formatMonth(month)}`}
                onPress={() => choose(d)}
                style={styles.cell}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.day,
                      selected && { backgroundColor: c.accent },
                      !selected && pressed && { backgroundColor: c.pressed },
                    ]}
                  >
                    <Txt
                      variant="label"
                      weight={selected || isToday ? 'semibold' : 'medium'}
                      tabular
                      color={selected ? c.onAccent : future ? c.lineStrong : isToday ? c.accent : c.ink}
                    >
                      {d.getDate()}
                    </Txt>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: gutter - 6, paddingBottom: 8 },
  quick: { flexDirection: 'row', gap: 8, paddingHorizontal: 6, marginTop: 4, marginBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  monthLabel: { flex: 1 },
  hidden: { opacity: 0 },
  week: { flexDirection: 'row', marginBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  day: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
