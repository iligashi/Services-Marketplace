import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics are a native nicety; on web they are skipped silently.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export function tapFeedback() {
  if (enabled) Haptics.selectionAsync().catch(() => {});
}

export function impactFeedback(style = Haptics.ImpactFeedbackStyle.Light) {
  if (enabled) Haptics.impactAsync(style).catch(() => {});
}

export function successFeedback() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
