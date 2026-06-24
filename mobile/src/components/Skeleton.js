import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

// A single shimmering placeholder block
export function SkeletonBlock({ width, height, borderRadius = 8, style }) {
  const { colors, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: isDark ? colors.bgAlt : '#E2E8F0', opacity: pulse },
        style,
      ]}
    />
  );
}

// Job-card-shaped skeleton, matches JobCard layout
export function JobCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6,
      padding: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <SkeletonBlock width={90} height={22} borderRadius={999} />
        <SkeletonBlock width={60} height={22} borderRadius={6} />
      </View>
      <SkeletonBlock width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="95%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="60%" height={12} style={{ marginBottom: 14 }} />
      <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonBlock width={120} height={12} />
        <SkeletonBlock width={50} height={12} />
      </View>
    </View>
  );
}

export function JobListSkeleton({ count = 4 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => <JobCardSkeleton key={i} />)}
    </View>
  );
}
