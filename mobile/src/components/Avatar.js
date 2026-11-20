import React from 'react';
import { View, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaUrl } from '../config';

// Stable gradient per name, so every user keeps the same avatar colors
const GRADIENTS = [
  ['#5AC8FA', '#007AFF'],
  ['#BF5AF2', '#5E5CE6'],
  ['#FF6482', '#FF2D55'],
  ['#34C759', '#00C7BE'],
  ['#FFB340', '#FF9500'],
  ['#64D2FF', '#5856D6'],
  ['#FF9F0A', '#FF375F'],
  ['#30D158', '#32ADE6'],
];

function gradientFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function Avatar({ name, uri, size = 44, fontSize, ring, style }) {
  const resolved = mediaUrl(uri);
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

  const base = {
    width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    ...(ring ? { borderWidth: 3, borderColor: 'rgba(255,255,255,0.85)' } : {}),
  };

  if (resolved) {
    return <Image source={{ uri: resolved }} style={[base, style]} />;
  }

  return (
    <LinearGradient colors={gradientFor(name || '')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[base, style]}>
      <Text style={{ color: '#fff', fontSize: fontSize || size * 0.38, fontWeight: '700', letterSpacing: 0.5 }}>{initials}</Text>
    </LinearGradient>
  );
}
