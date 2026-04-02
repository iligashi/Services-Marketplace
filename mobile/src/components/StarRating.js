import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

export default function StarRating({ rating, size = 14, showValue = false }) {
  const r = parseFloat(rating) || 0;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.round(r);
    stars.push(
      <Text key={i} style={{ fontSize: size, color: filled ? colors.gold : '#E2E8F0', marginRight: 1 }}>
        {'\u2605'}
      </Text>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {stars}
      {showValue && r > 0 && (
        <Text style={{ fontSize: size - 2, color: colors.textSecondary, marginLeft: 4, fontWeight: '600' }}>
          {r.toFixed(1)}
        </Text>
      )}
    </View>
  );
}
