import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// A single pulsing placeholder block
export function SkeletonBlock({ width, height, borderRadius = 8, style }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.fill, opacity: pulse }, style]} />;
}

// Matches the JobCard layout
export function JobCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 22 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <SkeletonBlock width={44} height={44} borderRadius={12} />
        <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
          <SkeletonBlock width="75%" height={15} />
          <SkeletonBlock width="40%" height={11} />
        </View>
        <SkeletonBlock width={54} height={22} />
      </View>
      <SkeletonBlock width="95%" height={12} style={{ marginTop: 16 }} />
      <SkeletonBlock width="70%" height={12} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        <SkeletonBlock width={120} height={12} />
        <SkeletonBlock width={64} height={18} borderRadius={9} />
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
