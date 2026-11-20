import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';

export { lightColors, darkColors };

const THEME_KEY = '@app_theme';

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
          // Follow the system preference on first launch
          setIsDark(Appearance.getColorScheme() === 'dark');
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const toggleTheme = () => {
    // Dip the content slightly while the palette swaps
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.6, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    setIsDark((prev) => {
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
