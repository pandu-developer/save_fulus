import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';

import type { WeekTotal } from '@/data/selectors';
import { formatDateShort } from '@/lib/date';
import { compact, rupiah } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { hairline } from '@/theme/tokens';
import { Txt } from '../ui/Txt';

const LABEL_TOP = 18; // ruang label nilai di atas bar
const LABEL_BOTTOM = 20; // ruang label minggu
const BAR_MAX = 24;
const R = 4;

// Kolom dengan ujung atas membulat 4px dan dasar persegi.
function columnPath(x: number, y: number, w: number, h: number): string {
  if (h <= 0) return '';
  const r = Math.min(R, h, w / 2);
  const b = y + h;
  return `M${x},${b} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${b} Z`;
}

/** Pengeluaran per minggu: minggu ini aksen, minggu lain abu-abu sebagai konteks. */
export function WeeklyBars({ weeks, height = 150 }: { weeks: WeekTotal[]; height?: number }) {
  const { c } = useAppTheme();
  const [width, setWidth] = useState(0);
  const max = Math.max(...weeks.map((w) => w.total), 1);
  const plotH = height - LABEL_TOP - LABEL_BOTTOM;
  const slot = width / Math.max(weeks.length, 1);
  const barW = Math.min(BAR_MAX, slot * 0.5);
  const baseY = LABEL_TOP + plotH;

  const summary = weeks
    .map((w, i) => `${i === weeks.length - 1 ? 'Minggu ini' : `Minggu ${formatDateShort(w.start)}`}: ${rupiah(w.total)}`)
    .join('; ');

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height }}
      accessible
      accessibilityLabel={`Pengeluaran per minggu. ${summary}`}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Line x1={0} x2={width} y1={baseY} y2={baseY} stroke={c.lineStrong} strokeWidth={hairline * 2} />
          {weeks.map((w, i) => {
            const h = (w.total / max) * plotH;
            const x = i * slot + (slot - barW) / 2;
            const current = i === weeks.length - 1;
            return <Path key={i} d={columnPath(x, baseY - h, barW, h)} fill={current ? c.accent : c.chartMuted} />;
          })}
        </Svg>
      ) : null}
      {width > 0
        ? weeks.map((w, i) => {
            const current = i === weeks.length - 1;
            const h = (w.total / max) * plotH;
            return (
              <View key={i} style={[styles.col, { left: i * slot, width: slot }]}>
                <Txt
                  variant="micro"
                  tabular
                  align="center"
                  weight={current ? 'semibold' : 'medium'}
                  tone={current ? 'ink' : 'ink2'}
                  style={[styles.value, { top: baseY - h - 16 }]}
                >
                  {w.total > 0 ? compact(w.total) : '–'}
                </Txt>
                <Txt
                  variant="micro"
                  align="center"
                  tone={current ? 'ink' : 'ink3'}
                  weight={current ? 'semibold' : 'medium'}
                  style={[styles.week, { top: baseY + 6 }]}
                  numberOfLines={1}
                >
                  {current ? 'Minggu ini' : formatDateShort(w.start)}
                </Txt>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { position: 'absolute', top: 0, bottom: 0, pointerEvents: 'none' },
  value: { position: 'absolute', left: 0, right: 0 },
  week: { position: 'absolute', left: 0, right: 0 },
});
