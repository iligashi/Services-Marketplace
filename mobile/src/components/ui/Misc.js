import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows, statusConfig, bidStatusConfig } from '../../theme';
import Tappable from './Tappable';
import Button from './Button';
import { alpha, toneColor } from './tone';

/** White rounded surface with a soft shadow. Tappable when onPress is given. */
export function Card({ children, style, onPress, padded = true }) {
  const { colors, isDark } = useTheme();
  const base = [
    { backgroundColor: colors.card, borderRadius: 22, padding: padded ? 16 : 0 },
    !isDark && shadows.sm,
    style,
  ];
  if (onPress) return <Tappable onPress={onPress} scaleTo={0.98} style={base}>{children}</Tappable>;
  return <View style={base}>{children}</View>;
}

/** Rounded-square icon, like the colored tiles in iOS Settings. variant: solid | soft */
export function IconTile({ icon, tone = 'primary', size = 36, variant = 'solid', style }) {
  const { colors } = useTheme();
  const c = toneColor(colors, tone);
  const solid = variant === 'solid';
  return (
    <View style={[{
      width: size, height: size, borderRadius: size * 0.28,
      backgroundColor: solid ? c : alpha(c, 0.14),
      alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <Ionicons name={icon} size={size * 0.56} color={solid ? '#FFFFFF' : c} />
    </View>
  );
}

/** Small capsule label. */
export function Pill({ label, icon, tone = 'primary', style, size = 'md' }) {
  const { colors } = useTheme();
  const c = toneColor(colors, tone);
  const small = size === 'sm';
  const bg = alpha(c, 0.13);
  return (
    <View style={[{
      flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
      backgroundColor: bg === c ? colors.fill : bg,
      paddingHorizontal: small ? 8 : 10, paddingVertical: small ? 3 : 5, borderRadius: 999,
    }, style]}>
      {icon ? <Ionicons name={icon} size={small ? 11 : 13} color={c} /> : null}
      <Text style={[small ? type.caption2 : type.caption, { color: c, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status, kind = 'job', size, style }) {
  const cfg = (kind === 'bid' ? bidStatusConfig : statusConfig)[status] || statusConfig.open;
  return <Pill label={cfg.label} icon={cfg.icon} tone={cfg.tone} size={size} style={style} />;
}

/** Section title with an optional trailing action, Apple Store style. */
export function SectionHeader({ title, action, onAction, style }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 26, marginBottom: 12 }, style]}>
      <Text style={[type.title3, { color: colors.text, fontWeight: '700' }]}>{title}</Text>
      {action ? (
        <Text onPress={onAction} style={[type.subhead, { color: colors.primary }]}>{action}</Text>
      ) : null}
    </View>
  );
}

/** Friendly empty or error state with a soft icon halo. */
export function EmptyState({ icon = 'sparkles-outline', tone = 'primary', title, message, actionLabel, onAction, style }) {
  const { colors } = useTheme();
  const c = toneColor(colors, tone);
  return (
    <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 48 }, style]}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: alpha(c, 0.08), alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: alpha(c, 0.14), alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={32} color={c} />
        </View>
      </View>
      <Text style={[type.title3, { color: colors.text, textAlign: 'center', marginBottom: 6 }]}>{title}</Text>
      {message ? <Text style={[type.subhead, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text> : null}
      {actionLabel ? (
        <Button title={actionLabel} onPress={onAction} size="md" variant="tinted" style={{ marginTop: 20 }} />
      ) : null}
    </View>
  );
}

/** Fades and lifts its child in on mount; index staggers lists. */
export function Appear({ index = 0, children, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: 1, delay: Math.min(index, 8) * 45, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }, []);
  return (
    <Animated.View style={[style, {
      opacity: v,
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

/** Label/value pair used in stat strips. */
export function Stat({ value, label, tone, align = 'center' }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: align === 'center' ? 'center' : 'flex-start', paddingVertical: 14 }}>
      <Text style={[type.title2, { color: tone ? toneColor(colors, tone) : colors.text }]} numberOfLines={1}>{value}</Text>
      <Text style={[type.caption, { color: colors.textSecondary, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}
