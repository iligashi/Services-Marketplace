import { Platform } from 'react-native';

// Backend host. Set in mobile/.env (Expo inlines EXPO_PUBLIC_* at build time):
//   EXPO_PUBLIC_SERVER_URL      used on the web build (default http://localhost:3000)
//   EXPO_PUBLIC_LAN_SERVER_URL  used on phones/emulators, e.g. http://192.168.0.10:3000
export const SERVER_URL = Platform.OS === 'web'
  ? process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000'
  : process.env.EXPO_PUBLIC_LAN_SERVER_URL || 'http://192.168.0.127:3000';

export const API_URL = `${SERVER_URL}/api`;

// Resolve an avatar/photo path returned by the API into a full URL
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
}
