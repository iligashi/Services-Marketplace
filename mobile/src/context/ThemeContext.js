import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@app_theme';

export const lightColors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryBg: '#EFF6FF',
  primaryBorder: '#BFDBFE',

  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  accentDark: '#D97706',

  success: '#10B981',
  successBg: '#D1FAE5',
  successDark: '#059669',

  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#06B6D4',
  infoBg: '#CFFAFE',

  white: '#FFFFFF',
  bg: '#F1F5F9',
  bgAlt: '#E2E8F0',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F8FAFC',

  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  overlay: 'rgba(15, 23, 42, 0.6)',
  shadow: 'rgba(15, 23, 42, 0.1)',
  gold: '#F59E0B',
  goldBg: '#FEF3C7',
  gradientStart: '#1E3A8A',
  gradientEnd: '#2563EB',

  // UI specific
  inputBg: '#F8FAFC',
  tabBar: '#FFFFFF',
  statusBar: 'dark-content',
};

export const darkColors = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  primaryBg: 'rgba(59,130,246,0.12)',
  primaryBorder: 'rgba(59,130,246,0.3)',

  accent: '#FBBF24',
  accentLight: 'rgba(251,191,36,0.15)',
  accentDark: '#F59E0B',

  success: '#34D399',
  successBg: 'rgba(52,211,153,0.15)',
  successDark: '#10B981',

  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.15)',
  error: '#F87171',
  errorBg: 'rgba(248,113,113,0.15)',
  info: '#22D3EE',
  infoBg: 'rgba(34,211,238,0.15)',

  white: '#1E293B',
  bg: '#0F172A',
  bgAlt: '#1E293B',
  card: '#1E293B',
  border: '#334155',
  borderLight: '#1E293B',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  overlay: 'rgba(0, 0, 0, 0.7)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  gold: '#FBBF24',
  goldBg: 'rgba(251,191,36,0.15)',
  gradientStart: '#0F172A',
  gradientEnd: '#1E3A8A',

  inputBg: '#1E293B',
  tabBar: '#1E293B',
  statusBar: 'light-content',
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
  fadeAnim: null,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved !== null) {
          setIsDark(saved === 'dark');
        } else {
          // Follow system preference on first launch
          setIsDark(Appearance.getColorScheme() === 'dark');
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const toggleTheme = () => {
    // Fade out content slightly, switch theme, fade back in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.6,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setIsDark(prev => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light').catch(() => {});
      return next;
    });
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? darkColors : lightColors, toggleTheme, fadeAnim }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
