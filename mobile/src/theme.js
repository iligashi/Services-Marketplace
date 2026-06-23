export const colors = {
  // Brand
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryBg: '#EFF6FF',
  primaryBorder: '#BFDBFE',

  // Accent - warm amber for highlights
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  accentDark: '#D97706',

  // Success / green
  success: '#10B981',
  successBg: '#D1FAE5',
  successDark: '#059669',

  // Status colors
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#06B6D4',
  infoBg: '#CFFAFE',

  // Neutrals
  white: '#FFFFFF',
  bg: '#F1F5F9',
  bgAlt: '#E2E8F0',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F8FAFC',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Misc
  overlay: 'rgba(15, 23, 42, 0.6)',
  shadow: 'rgba(15, 23, 42, 0.1)',
  gold: '#F59E0B',
  goldBg: '#FEF3C7',

  // Gradient start/end (for backgrounds)
  gradientStart: '#1E3A8A',
  gradientEnd: '#2563EB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, color: colors.textTertiary, textTransform: 'uppercase' },
  button: { fontSize: 16, fontWeight: '700' },
  buttonSmall: { fontSize: 14, fontWeight: '600' },
};

export const shadows = {
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
};

export const statusConfig = {
  open: { label: 'Open', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle' },
  assigned: { label: 'Assigned', color: '#2563EB', bg: '#DBEAFE', icon: 'person-circle' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
  completed: { label: 'Completed', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-done-circle' },
  disputed: { label: 'Disputed', color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F1F5F9', icon: 'close-circle' },
};
