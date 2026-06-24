import { Platform } from 'react-native';

// Backend host — web hits localhost, native devices hit the LAN IP
export const SERVER_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.0.127:3000';

export const API_URL = `${SERVER_URL}/api`;

// Resolve an avatar/photo path returned by the API into a full URL
export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SERVER_URL}${path}`;
}
