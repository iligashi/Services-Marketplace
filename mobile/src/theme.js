import { Platform } from 'react-native';

// Apple-inspired palettes (iOS system colors). Every screen reads colors from
// useTheme() so light and dark mode stay in sync.
export const lightColors = {
  primary: '#007AFF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0062CC',
  primaryBg: 'rgba(0,122,255,0.10)',
  primaryBorder: 'rgba(0,122,255,0.24)',

  accent: '#FF9500',
  accentLight: 'rgba(255,149,0,0.12)',
  accentDark: '#C93400',

  success: '#34C759',
  successBg: 'rgba(52,199,89,0.12)',
  successDark: '#248A3D',
  warning: '#FF9500',
  warningBg: 'rgba(255,149,0,0.12)',
  error: '#FF3B30',
  errorBg: 'rgba(255,59,48,0.10)',
  info: '#32ADE6',
  infoBg: 'rgba(50,173,230,0.12)',
  purple: '#AF52DE',
  indigo: '#5856D6',
  teal: '#30B0C7',
  pink: '#FF2D55',
  gold: '#FF9F0A',
  goldBg: 'rgba(255,159,10,0.14)',

  white: '#FFFFFF',
  bg: '#F2F2F7',
  bgAlt: '#E5E5EA',
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  fill: 'rgba(118,118,128,0.12)',
  fillStrong: 'rgba(118,118,128,0.20)',
  separator: 'rgba(60,60,67,0.14)',
  border: 'rgba(60,60,67,0.14)',
  borderLight: 'rgba(60,60,67,0.06)',

  text: '#000000',
  textSecondary: 'rgba(60,60,67,0.62)',
  textTertiary: 'rgba(60,60,67,0.36)',
  textInverse: '#FFFFFF',

  glass: 'rgba(250,250,252,0.72)',
  glassBorder: 'rgba(255,255,255,0.65)',
  bubbleTheirs: '#E9E9EB',
  overlay: 'rgba(0,0,0,0.4)',
  shadow: '#000000',
  shadowOpacity: 1,
  inputBg: 'rgba(118,118,128,0.12)',

  // Brand gradients
  gradientStart: '#0A84FF',
  gradientEnd: '#5E5CE6',
  gradientHero: ['#0A84FF', '#5E5CE6', '#AF52DE'],
  gradientMoney: ['#30D158', '#00C7BE'],
};

export const darkColors = {
  ...lightColors,
  primary: '#0A84FF',
  primaryLight: '#409CFF',
  primaryDark: '#0071E3',
  primaryBg: 'rgba(10,132,255,0.18)',
  primaryBorder: 'rgba(10,132,255,0.36)',

  accent: '#FF9F0A',
  accentLight: 'rgba(255,159,10,0.18)',
  success: '#30D158',
  successBg: 'rgba(48,209,88,0.18)',
  warning: '#FF9F0A',
  warningBg: 'rgba(255,159,10,0.18)',
  error: '#FF453A',
  errorBg: 'rgba(255,69,58,0.18)',
  info: '#64D2FF',
  infoBg: 'rgba(100,210,255,0.16)',
  purple: '#BF5AF2',
  indigo: '#5E5CE6',
  teal: '#40C8E0',
  pink: '#FF375F',
  gold: '#FFD60A',
  goldBg: 'rgba(255,214,10,0.16)',

  white: '#1C1C1E',
  bg: '#000000',
  bgAlt: '#2C2C2E',
  card: '#1C1C1E',
  elevated: '#2C2C2E',
  fill: 'rgba(118,118,128,0.24)',
  fillStrong: 'rgba(118,118,128,0.36)',
  separator: 'rgba(84,84,88,0.55)',
  border: 'rgba(84,84,88,0.55)',
  borderLight: 'rgba(84,84,88,0.3)',

  text: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.62)',
  textTertiary: 'rgba(235,235,245,0.32)',
  textInverse: '#000000',

  glass: 'rgba(28,28,30,0.72)',
  glassBorder: 'rgba(255,255,255,0.10)',
  bubbleTheirs: '#26252A',
  overlay: 'rgba(0,0,0,0.6)',
  inputBg: 'rgba(118,118,128,0.24)',
};

const fontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Segoe UI", Roboto, sans-serif',
  default: undefined,
});

// iOS text styles (Human Interface Guidelines sizes)
export const type = {
  largeTitle: { fontFamily, fontSize: 34, fontWeight: '700', letterSpacing: 0.37 },
  title1: { fontFamily, fontSize: 28, fontWeight: '700', letterSpacing: 0.36 },
  title2: { fontFamily, fontSize: 22, fontWeight: '700', letterSpacing: 0.35 },
  title3: { fontFamily, fontSize: 20, fontWeight: '600', letterSpacing: 0.38 },
  headline: { fontFamily, fontSize: 17, fontWeight: '600', letterSpacing: -0.41 },
  body: { fontFamily, fontSize: 17, fontWeight: '400', letterSpacing: -0.41, lineHeight: 22 },
  callout: { fontFamily, fontSize: 16, fontWeight: '400', letterSpacing: -0.32, lineHeight: 21 },
  subhead: { fontFamily, fontSize: 15, fontWeight: '400', letterSpacing: -0.24, lineHeight: 20 },
  footnote: { fontFamily, fontSize: 13, fontWeight: '400', letterSpacing: -0.08, lineHeight: 18 },
  caption: { fontFamily, fontSize: 12, fontWeight: '500', letterSpacing: 0 },
  caption2: { fontFamily, fontSize: 11, fontWeight: '600', letterSpacing: 0.07 },
};

// Soft, diffuse shadows
export const shadows = {
  xs: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 40, elevation: 12 },
  glow: (color) => ({ shadowColor: color, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10 }),
};

// Job status → semantic tone; StatusPill resolves the tone against the active palette
export const statusConfig = {
  open: { label: 'Open', tone: 'success', icon: 'radio-button-on' },
  assigned: { label: 'Assigned', tone: 'primary', icon: 'person-circle' },
  in_progress: { label: 'In Progress', tone: 'warning', icon: 'time' },
  completed: { label: 'Completed', tone: 'success', icon: 'checkmark-circle' },
  disputed: { label: 'Disputed', tone: 'error', icon: 'alert-circle' },
  cancelled: { label: 'Cancelled', tone: 'textSecondary', icon: 'close-circle' },
};

export const bidStatusConfig = {
  pending: { label: 'Pending', tone: 'warning', icon: 'hourglass' },
  accepted: { label: 'Accepted', tone: 'success', icon: 'checkmark-circle' },
  rejected: { label: 'Declined', tone: 'textSecondary', icon: 'close-circle' },
};
