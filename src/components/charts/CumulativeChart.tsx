import { useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { BULAN_SINGKAT, daysInMonth, type YearMonth } from '@/lib/date';
import { compact, rupiah } from '@/lib/format';
import { useAppTheme } from '@/theme/ThemeProvider';
import { hairline } from '@/theme/tokens';
import { Txt } from '../ui/Txt';

interface Props {
  month: YearMonth;
  prevMonth: YearMonth;
  current: number[]; // kumulatif per hari, hanya sampai hari yang sudah lewat
  previous: number[]; // kumulatif bulan pembanding (penuh)
  height?: number;
}

const PAD_LEFT = 44; // ruang label sumbu Y
const PAD_TOP = 8;
const PAD_BOTTOM = 22; // ruang label tanggal

// Langkah dipilih agar maksimum DAN nilai tengahnya sama-sama angka bulat
// (mis. 6 jt → 3 jt, 1,6 jt → 800 rb), sekaligus tidak menyisakan ruang kosong berlebihan.
const NICE_STEPS = [1, 1.2, 1.6, 2, 3, 4, 5, 6, 8, 10];

function niceMax(v: number): number {
  if (v <= 0) return 100000;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (NICE_STEPS.find((s) => s >= f) ?? 10) * exp;
}

function linePath(values: number[], x: (i: number) => number, y: (v: number) => number): string {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}

/**
 * Pengeluaran kumulatif bulan ini (aksen) vs bulan pembanding (abu-abu, konteks).
 * Tahan & geser untuk membaca nilai per tanggal.
 */
export function CumulativeChart({ month, prevMonth, current, previous, height = 176 }: Props) {
  const { c } = useAppTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const totalDays = Math.max(daysInMonth(month.y, month.m), previous.length);
  const maxV = niceMax(Math.max(...current, ...previous, 1));
  const plotW = Math.max(width - PAD_LEFT, 1);
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = (i: number) => PAD_LEFT + (i / (totalDays - 1)) * plotW;
  const y = (v: number) => PAD_TOP + plotH - (v / maxV) * plotH;

  const pan = useMemo(() => {
    const indexAt = (px: number) =>
      Math.min(Math.max(Math.round(((px - PAD_LEFT) / plotW) * (totalDays - 1)), 0), totalDays - 1);
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (e) => setActive(indexAt(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setActive(indexAt(e.nativeEvent.locationX)),
      onPanResponderRelease: () => setActive(null),
      onPanResponderTerminate: () => setActive(null),
    });
  }, [plotW, totalDays]);

  const ticks = [0, maxV / 2, maxV];
  const dayTicks = [1, 8, 15, 22, 29].filter((d) => d <= totalDays);
  const lastIdx = current.length - 1;
  const readIdx = active ?? Math.max(lastIdx, 0);
  const curVal = current[readIdx];
  const prevVal = previous[readIdx];

  return (
    <View>
      {/* Legenda sekaligus pembaca nilai — tinggi tetap supaya tidak ada lompatan layout */}
      <View style={styles.readout}>
        <Txt variant="label" tone="ink2" tabular>
          Tgl {readIdx + 1}
        </Txt>
        <View style={styles.key}>
          <View style={[styles.keyLine, { backgroundColor: c.accent }]} />
          <Txt variant="label" tone="ink2">
            {BULAN_SINGKAT[month.m]}{' '}
          </Txt>
          <Txt variant="label" weight="semibold" tabular>
            {curVal !== undefined ? rupiah(curVal) : '—'}
          </Txt>
        </View>
        <View style={styles.key}>
          <View style={[styles.keyLine, { backgroundColor: c.ink3 }]} />
          <Txt variant="label" tone="ink2">
            {BULAN_SINGKAT[prevMonth.m]}{' '}
          </Txt>
          <Txt variant="label" tone="ink2" tabular>
            {prevVal !== undefined ? rupiah(prevVal) : '—'}
          </Txt>
        </View>
      </View>

      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height }}
        accessible
        accessibilityLabel={`Pengeluaran kumulatif ${BULAN_SINGKAT[month.m]} ${rupiah(current[lastIdx] ?? 0)} sampai tanggal ${lastIdx + 1}. Bulan pembanding ${rupiah(previous[previous.length - 1] ?? 0)}.`}
        {...pan.panHandlers}
      >
        {width > 0 ? (
          <View style={[StyleSheet.absoluteFill, styles.passThrough]}>
            <Svg width={width} height={height}>
              {ticks.map((t) => (
                <Line
                  key={t}
                  x1={PAD_LEFT}
                  x2={width}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={t === 0 ? c.lineStrong : c.line}
                  strokeWidth={hairline * 2}
                />
              ))}
              {previous.length > 1 ? (
                <Path
                  d={linePath(previous, x, y)}
                  stroke={c.ink3}
                  strokeWidth={2}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {current.length > 1 ? (
                <Path
                  d={linePath(current, x, y)}
                  stroke={c.accent}
                  strokeWidth={2}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {active !== null ? (
                <Line x1={x(active)} x2={x(active)} y1={PAD_TOP} y2={PAD_TOP + plotH} stroke={c.ink2} strokeWidth={1} />
              ) : null}
              {curVal !== undefined ? (
                <Circle cx={x(readIdx)} cy={y(curVal)} r={4} fill={c.accent} stroke={c.bg} strokeWidth={2} />
              ) : null}
            </Svg>
            {/* Label sumbu sebagai Text biasa agar memakai font aplikasi */}
            {ticks.map((t) => (
              <Txt key={t} variant="micro" tone="ink3" tabular style={[styles.yLabel, { top: y(t) - 7 }]}>
                {t === 0 ? '0' : compact(t)}
              </Txt>
            ))}
            {dayTicks.map((d) => (
              <Txt
                key={d}
                variant="micro"
                tone="ink3"
                tabular
                align="center"
                style={[styles.xLabel, { left: x(d - 1) - 12, top: PAD_TOP + plotH + 6 }]}
              >
                {d}
              </Txt>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 14,
    rowGap: 4,
    marginBottom: 10,
    minHeight: 18,
  },
  key: { flexDirection: 'row', alignItems: 'center' },
  keyLine: { width: 12, height: 2, borderRadius: 1, marginRight: 6 },
  // Sentuhan diteruskan ke kontainer agar koordinat geser selalu relatif ke grafik.
  passThrough: { pointerEvents: 'none' },
  yLabel: { position: 'absolute', left: 0, width: PAD_LEFT - 8 },
  xLabel: { position: 'absolute', width: 24 },
});
