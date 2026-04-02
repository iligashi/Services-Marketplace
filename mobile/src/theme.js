// Premium Design System
export const colors = {
  // Primary palette
  primary: '#4F46E5',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',

  // Accent
  accent: '#10B981',        // Emerald green
  accentLight: '#D1FAE5',
  accentDark: '#059669',

  // Status
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  success: '#10B981',
  successBg: '#D1FAE5',
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  // Neutrals
  white: '#FFFFFF',
  bg: '#F8FAFC',
  bgAlt: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Misc
  overlay: 'rgba(15, 23, 42, 0.5)',
  shadow: 'rgba(15, 23, 42, 0.08)',
  gold: '#F59E0B',
  goldBg: '#FEF3C7',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  h3: { fontSize: 18, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3, color: colors.textTertiary, textTransform: 'uppercase' },
  button: { fontSize: 16, fontWeight: '600' },
  buttonSmall: { fontSize: 14, fontWeight: '600' },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const statusConfig = {
  open: { label: 'Open', color: '#10B981', bg: '#D1FAE5', icon: '●' },
  assigned: { label: 'Assigned', color: '#3B82F6', bg: '#DBEAFE', icon: '●' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', icon: '●' },
  completed: { label: 'Completed', color: '#10B981', bg: '#D1FAE5', icon: '✓' },
  disputed: { label: 'Disputed', color: '#EF4444', bg: '#FEE2E2', icon: '!' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F1F5F9', icon: '✕' },
};
