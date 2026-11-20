import React from 'react';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

/**
 * Frosted "glass" surface used by the navigation bar, tab bar and sticky footers.
 * Native: a real blur. Web: CSS backdrop-filter over a translucent fill.
 */
export default function Glass({ style, children, intensity = 70, pointerEvents }) {
  const { isDark, colors } = useTheme();

  if (Platform.OS === 'web') {
    return (
      <View
        pointerEvents={pointerEvents}
        style={[
          {
            backgroundColor: colors.glass,
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      pointerEvents={pointerEvents}
      intensity={intensity}
      tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      experimentalBlurMethod="dimezisBlurView"
      style={[{ overflow: 'hidden', backgroundColor: Platform.OS === 'android' ? colors.glass : undefined }, style]}
    >
      {children}
    </BlurView>
  );
}
