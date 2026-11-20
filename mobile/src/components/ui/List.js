import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import Tappable from './Tappable';
import { IconTile } from './Misc';

/**
 * Inset-grouped section (like iOS Settings): optional header, rounded card,
 * hairline separators between rows, optional footer text.
 */
export function Section({ title, footer, children, style, separatorInset = 16 }) {
  const { colors } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[{ marginHorizontal: 16, marginTop: 24 }, style]}>
      {title ? (
        <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 16, marginBottom: 7 }]}>
          {title}
        </Text>
      ) : null}
      <View style={{ backgroundColor: colors.card, borderRadius: 18, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <View key={row.key ?? i}>
            {row}
            {i < rows.length - 1 ? (
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: separatorInset }} />
            ) : null}
          </View>
        ))}
      </View>
      {footer ? (
        <Text style={[type.footnote, { color: colors.textSecondary, marginHorizontal: 16, marginTop: 7 }]}>{footer}</Text>
      ) : null}
    </View>
  );
}

/** A row inside a Section: icon tile, title/subtitle, trailing value, chevron or custom control. */
export function Row({
  icon, iconTone = 'primary', title, subtitle, value, valueColor, chevron, right, onPress, destructive, center, children,
}) {
  const { colors } = useTheme();
  const titleColor = destructive ? colors.error : center ? colors.primary : colors.text;

  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
      {icon ? <IconTile icon={icon} tone={destructive ? 'error' : iconTone} size={30} /> : null}
      <View style={{ flex: 1, alignItems: center ? 'center' : 'flex-start' }}>
        {title ? <Text style={[type.body, { color: titleColor, fontWeight: center ? '600' : '400' }]}>{title}</Text> : null}
        {subtitle ? <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 1 }]}>{subtitle}</Text> : null}
        {children}
      </View>
      {value !== undefined && value !== null ? (
        <Text style={[type.body, { color: valueColor || colors.textSecondary }]} numberOfLines={1}>{value}</Text>
      ) : null}
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={17} color={colors.textTertiary} /> : null}
    </View>
  );

  if (!onPress) return inner;
  return <Tappable onPress={onPress} scaleTo={0.985}>{inner}</Tappable>;
}
