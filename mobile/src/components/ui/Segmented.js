import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { tapFeedback } from '../../utils/haptics';

/** iOS segmented control with a sliding thumb. options: [{ key, label, count? }] */
export default function Segmented({ options, value, onChange, style }) {
  const { colors, isDark } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useRef(new Animated.Value(0)).current;
  const segment = width > 0 ? (width - 4) / options.length : 0;

  useEffect(() => {
    Animated.spring(x, { toValue: index * segment, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  }, [index, segment]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[{ flexDirection: 'row', backgroundColor: colors.fill, borderRadius: 11, padding: 2, height: 36 }, style]}
    >
      {segment > 0 ? (
        <Animated.View
          style={{
            position: 'absolute', top: 2, left: 2, bottom: 2, width: segment, borderRadius: 9,
            backgroundColor: isDark ? '#636366' : '#FFFFFF',
            shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2,
            transform: [{ translateX: x }],
          }}
        />
      ) : null}
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => { if (!active) { tapFeedback(); onChange(o.key); } }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }}
          >
            <Text style={[type.footnote, { fontWeight: active ? '600' : '500', color: colors.text }]} numberOfLines={1}>{o.label}</Text>
            {o.count !== undefined ? (
              <Text style={[type.caption2, { color: active ? (isDark ? colors.text : colors.primary) : colors.textSecondary }]}>{o.count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
