import React from 'react';
import { Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows } from '../../theme';
import Tappable from './Tappable';
import { alpha, toneColor } from './tone';

const SIZES = {
  lg: { height: 54, radius: 16, font: type.headline, icon: 20, px: 20 },
  md: { height: 44, radius: 13, font: { ...type.subhead, fontWeight: '600' }, icon: 18, px: 16 },
  sm: { height: 32, radius: 16, font: { ...type.footnote, fontWeight: '600' }, icon: 15, px: 12 },
};

/**
 * iOS-style buttons.
 * variant: filled | tinted | gray | plain | white
 * tone: any palette key (primary, success, error…) or a raw color
 */
export default function Button({
  title, icon, iconRight, onPress, variant = 'filled', tone = 'primary', size = 'lg',
  loading, disabled, gradient, style, flex,
}) {
  const { colors } = useTheme();
  const s = SIZES[size];
  const c = toneColor(colors, tone);

  const bg = {
    filled: c,
    tinted: alpha(c, 0.12) === c ? colors.fill : alpha(c, 0.12),
    gray: colors.fill,
    plain: 'transparent',
    white: '#FFFFFF',
  }[variant];
  const fg = { filled: '#FFFFFF', tinted: c, gray: colors.text, plain: c, white: c }[variant];
  const inactive = disabled || loading;

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {loading ? <ActivityIndicator color={fg} size="small" /> : null}
      {!loading && icon ? <Ionicons name={icon} size={s.icon} color={fg} /> : null}
      {title ? <Text style={[s.font, { color: fg }]} numberOfLines={1}>{title}</Text> : null}
      {!loading && iconRight ? <Ionicons name={iconRight} size={s.icon} color={fg} /> : null}
    </View>
  );

  const base = {
    height: s.height, borderRadius: s.radius, paddingHorizontal: s.px,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    opacity: disabled ? 0.45 : 1,
    ...(flex ? { flex: 1 } : null),
  };

  return (
    <Tappable
      onPress={onPress}
      disabled={inactive}
      style={[base, { backgroundColor: gradient ? undefined : bg }, variant === 'filled' && !disabled && size === 'lg' ? shadows.glow(c) : null, style]}
    >
      {gradient && variant === 'filled' ? (
        <LinearGradient
          colors={colors.gradientHero.slice(0, 2)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {content}
    </Tappable>
  );
}
