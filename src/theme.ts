// Palet warna terang & gelap + ukuran yang dipakai di seluruh aplikasi

export interface Colors {
  primary: string;
  primaryDark: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  textLight: string;
  border: string;
  white: string;
}

export const lightColors: Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  income: '#16A34A',
  incomeSoft: '#DCFCE7',
  expense: '#DC2626',
  expenseSoft: '#FEE2E2',
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

export const darkColors: Colors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  income: '#22C55E',
  incomeSoft: '#14311F',
  expense: '#F87171',
  expenseSoft: '#3B1D1D',
  background: '#0B1220',
  card: '#161F2E',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  border: '#26324A',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Bayangan lembut yang konsisten di iOS & Android
export const shadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};
