import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

export default function ProviderBadge({ rating, size = 'small' }) {
  const r = parseFloat(rating) || 0;
  if (r < 4.8) return null;

  const isLarge = size === 'large';

  return (
    <View style={[styles.badge, isLarge && styles.badgeLarge]}>
      <Text style={[styles.icon, isLarge && { fontSize: 11 }]}>{'\u2605'}</Text>
      <Text style={[styles.text, isLarge && styles.textLarge]}>TOP RATED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.goldBg,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.sm, gap: 3,
  },
  badgeLarge: { paddingHorizontal: 10, paddingVertical: 4 },
  icon: { fontSize: 8, color: colors.gold },
  text: { fontSize: 9, fontWeight: '800', color: '#92400E', letterSpacing: 0.5 },
  textLarge: { fontSize: 11 },
});
