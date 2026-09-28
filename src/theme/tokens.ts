import { StyleSheet } from 'react-native';

export type Scheme = 'light' | 'dark';

/**
 * Token warna semantik. Nilai sudah dicek kontrasnya (WCAG) terhadap bg,
 * surface, dan panel di kedua mode — jangan pakai hex mentah di komponen.
 */
export interface Palette {
  bg: string; // latar halaman ("kertas")
  surface: string; // permukaan terangkat: sheet, keypad
  panel: string; // wadah redup untuk bagian penting
  ink: string; // teks utama
  ink2: string; // teks sekunder
  ink3: string; // placeholder, label sumbu, mark de-emphasis
  line: string; // garis pemisah hairline
  lineStrong: string; // border input, garis dasar chart
  accent: string; // satu-satunya warna aksen: interaksi & status penting
  accentPressed: string;
  accentSoft: string; // latar terpilih, track meter
  onAccent: string;
  positive: string; // pemasukan / kondisi positif
  positiveSoft: string;
  negative: string; // pengeluaran berlebih, error
  negativeSoft: string;
  warning: string; // teks "mendekati batas"
  warningMark: string; // isi bar "mendekati batas"
  warningSoft: string;
  chartMuted: string; // bar konteks (minggu lain)
  pressed: string; // latar baris saat ditekan
  scrim: string; // latar gelap di belakang sheet
  toastBg: string;
  toastText: string;
  toastAction: string;
}

export const palettes: Record<Scheme, Palette> = {
  light: {
    bg: '#F6F4EF',
    surface: '#FCFBF8',
    panel: '#EDE9E1',
    ink: '#1E1D1A',
    ink2: '#5E5A52',
    ink3: '#837D73',
    line: '#E3DED4',
    lineStrong: '#CFC9BD',
    accent: '#3A48A8',
    accentPressed: '#2F3C8F',
    accentSoft: '#E3E5F2',
    onAccent: '#FFFFFF',
    positive: '#1B6F45',
    positiveSoft: '#E1EDE5',
    negative: '#B93A2B',
    negativeSoft: '#F5E1DC',
    warning: '#8C5A0E',
    warningMark: '#B26F0E',
    warningSoft: '#F3E8D6',
    chartMuted: '#CBC5BA',
    pressed: '#ECE8E0',
    scrim: 'rgba(30, 29, 26, 0.36)',
    toastBg: '#1E1D1A',
    toastText: '#F6F4EF',
    toastAction: '#B4BCF6',
  },
  dark: {
    bg: '#161614',
    surface: '#1E1E1B',
    panel: '#262521',
    ink: '#EDEBE6',
    ink2: '#A9A59C',
    ink3: '#77736B',
    line: '#2D2C28',
    lineStrong: '#3B3A35',
    accent: '#7C88E6',
    accentPressed: '#6A76D8',
    accentSoft: '#262A45',
    onAccent: '#111217',
    positive: '#57BD85',
    positiveSoft: '#1C2C23',
    negative: '#EE7B67',
    negativeSoft: '#3A221E',
    warning: '#D9A443',
    warningMark: '#D9A443',
    warningSoft: '#342A19',
    chartMuted: '#45433D',
    pressed: '#22211E',
    scrim: 'rgba(0, 0, 0, 0.6)',
    toastBg: '#EDEBE6',
    toastText: '#161614',
    toastAction: '#3A48A8',
  },
};

// Satu keluarga font (Plus Jakarta Sans — dirancang untuk Jakarta), tiga bobot.
export const font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
} as const;

export type FontWeightName = keyof typeof font;

// Enam ukuran saja. Angka besar = informasi finansial terpenting.
export const typeScale = {
  display: { fontFamily: font.semibold, fontSize: 40, lineHeight: 46, letterSpacing: -1 },
  title: { fontFamily: font.semibold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: font.medium, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
} as const;

export type TypeVariant = keyof typeof typeScale;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  x3: 32,
  x4: 40,
  x5: 48,
} as const;

// Jarak tepi layar — sedikit lebih lega dari 16 agar terasa editorial.
export const gutter = 20;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const hairline = StyleSheet.hairlineWidth;
