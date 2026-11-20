import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { Glass } from '../components/ui';
import { type, shadows } from '../theme';
import { tapFeedback } from '../utils/haptics';
import { useTabBar, TAB_BAR_HEIGHT } from './TabBarContext';

/**
 * Floating "liquid glass" tab bar:
 * - frosted capsule that content scrolls underneath
 * - a lens that slides to the selected tab
 * - shrinks to icons while scrolling down, expands on scroll up
 * - slides away on pushed screens (job details, chat…) to give them the full height
 *
 * Tab options: tabBarLabel, tabBarIconName: [focused, unfocused], tabBarAccent (round action button)
 */
export default function FloatingTabBar({ state, descriptors, navigation }) {
  const { colors, isDark } = useTheme();
  const tabBar = useTabBar();
  const [width, setWidth] = useState(0);
  const lens = useRef(new Animated.Value(0)).current;
  const hide = useRef(new Animated.Value(0)).current;

  const focusedRoute = state.routes[state.index];
  const hidden = (focusedRoute.state?.index ?? 0) > 0;
  const itemWidth = width > 0 ? (width - 12) / state.routes.length : 0;

  useEffect(() => {
    Animated.spring(lens, { toValue: state.index * itemWidth, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
  }, [state.index, itemWidth]);

  useEffect(() => {
    Animated.spring(hide, { toValue: hidden ? 1 : 0, useNativeDriver: true, speed: 16, bounciness: 0 }).start();
  }, [hidden]);

  const minimize = tabBar.minimize;
  const scale = minimize.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] });
  const translateY = Animated.add(
    minimize.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
    hide.interpolate({ inputRange: [0, 1], outputRange: [0, TAB_BAR_HEIGHT + tabBar.bottom + 30] }),
  );
  const labelOpacity = minimize.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' });
  const iconShift = minimize.interpolate({ inputRange: [0, 1], outputRange: [0, 7] });

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'box-none'}
      style={{
        position: 'absolute', left: 16, right: 16, bottom: tabBar.bottom,
        transform: [{ translateY }, { scale }],
      }}
    >
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[{ height: TAB_BAR_HEIGHT, borderRadius: TAB_BAR_HEIGHT / 2 }, shadows.lg, { shadowOpacity: isDark ? 0.5 : 0.14 }]}
      >
        <Glass style={[StyleSheet.absoluteFill, {
          borderRadius: TAB_BAR_HEIGHT / 2, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: colors.glassBorder,
        }]} />

        {itemWidth > 0 ? (
          <Animated.View style={{
            position: 'absolute', top: 6, left: 6, bottom: 6, width: itemWidth, borderRadius: (TAB_BAR_HEIGHT - 12) / 2,
            backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)',
            transform: [{ translateX: lens }],
          }} />
        ) : null}

        <View style={{ flex: 1, flexDirection: 'row', paddingHorizontal: 6 }}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            const label = options.tabBarLabel ?? options.title ?? route.name;
            const [onIcon, offIcon] = options.tabBarIconName || ['ellipse', 'ellipse-outline'];
            const color = focused ? colors.primary : colors.textSecondary;

            const onPress = () => {
              tapFeedback();
              tabBar.setMinimized(false);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate({ name: route.name, merge: true });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
                onPress={onPress}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              >
                {options.tabBarAccent ? (
                  <Animated.View style={{ transform: [{ translateY: iconShift }] }}>
                    <LinearGradient
                      colors={colors.gradientHero.slice(0, 2)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, shadows.glow(colors.primary)]}
                    >
                      <Ionicons name="add" size={26} color="#fff" />
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  <>
                    <Animated.View style={{ transform: [{ translateY: iconShift }] }}>
                      <Ionicons name={focused ? onIcon : offIcon} size={24} color={color} />
                    </Animated.View>
                    <Animated.Text
                      numberOfLines={1}
                      style={[type.caption2, { color, marginTop: 2, fontWeight: focused ? '700' : '600', opacity: labelOpacity }]}
                    >
                      {label}
                    </Animated.Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}
