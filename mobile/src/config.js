import { Platform } from 'react-native';

// Backend host. Expo inlines EXPO_PUBLIC_* at build time:
//   EXPO_PUBLIC_SERVER_URL      production API (set per profile in eas.json); used on every platform
//   EXPO_PUBLIC_LAN_SERVER_URL  development only: your machine's LAN address for phones/emulators
const DEV_SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : process.env.EXPO_PUBLIC_LAN_SERVER_URL || 'http://192.168.0.127:3000';

export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || DEV_SERVER_URL;

export const API_URL = `${SERVER_URL}/api`;

// Resolve an avatar/photo path returned by the API into a full URL
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
}
