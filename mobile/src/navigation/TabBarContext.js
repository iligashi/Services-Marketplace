import React, { createContext, useContext, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_HEIGHT = 64;

const TabBarContext = createContext(null);

/**
 * Shared state between the floating tab bar and the screens under it:
 * - inset: space a scrolling screen must leave so its last item clears the bar
 * - minimize: 0 → full bar, 1 → compact bar (set while scrolling down)
 */
export function TabBarProvider({ children }) {
  const insets = useSafeAreaInsets();
  const minimize = useRef(new Animated.Value(0)).current;
  const minimized = useRef(false);

  const value = useMemo(() => {
    const bottom = Math.max(insets.bottom, 14);
    return {
      bottom,
      inset: TAB_BAR_HEIGHT + bottom + 12,
      minimize,
      setMinimized(next) {
        if (minimized.current === next) return;
        minimized.current = next;
        Animated.spring(minimize, { toValue: next ? 1 : 0, useNativeDriver: true, speed: 16, bounciness: 5 }).start();
      },
    };
  }, [insets.bottom, minimize]);

  return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
}

// null when the screen is not inside a tab navigator
export function useTabBar() {
  return useContext(TabBarContext);
}
