import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { tapFeedback } from '../../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with a springy press-down scale and a light haptic tick,
 * the touch feedback used across the app instead of opacity fades.
 */
export default function Tappable({
  onPress, style, children, scaleTo = 0.97, haptic = true, disabled, ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const springTo = (toValue) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: toValue === 1 ? 8 : 0 }).start();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => springTo(scaleTo)}
      onPressOut={() => springTo(1)}
      onPress={(e) => {
        if (haptic) tapFeedback();
        onPress?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
