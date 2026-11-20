import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function StarRating({ rating, size = 14, showValue = false, color }) {
  const { colors } = useTheme();
  const r = parseFloat(rating) || 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = r >= i - 0.25 ? 'star' : r >= i - 0.75 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={color || colors.gold} />;
      })}
      {showValue && r > 0 ? (
        <Text style={{ fontSize: size - 1, color: color || colors.textSecondary, marginLeft: 4, fontWeight: '600' }}>{r.toFixed(1)}</Text>
      ) : null}
    </View>
  );
}
