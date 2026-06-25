import React from 'react';
import { View, Text, Image } from 'react-native';
import { mediaUrl } from '../config';

// Deterministic pleasant color from a name so each user has a stable avatar tint
const PALETTE = ['#2563EB', '#7C3AED', '#DB2777', '#059669', '#D97706', '#0891B2', '#DC2626', '#4F46E5'];
function colorFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, uri, size = 44, fontSize, ring, style }) {
  const resolved = mediaUrl(uri);
  const initial = (name || '?').charAt(0).toUpperCase();
  const bg = colorFor(name || '');

  const base = {
    width: size, height: size, borderRadius: size / 2,
    justifyContent: 'center', alignItems: 'center',
    ...(ring ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' } : {}),
  };

  if (resolved) {
    return <Image source={{ uri: resolved }} style={[base, { backgroundColor: bg }, style]} />;
  }

  return (
    <View style={[base, { backgroundColor: bg }, style]}>
      <Text style={{ color: '#fff', fontSize: fontSize || size * 0.42, fontWeight: '800' }}>{initial}</Text>
    </View>
  );
}
