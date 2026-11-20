import { Alert, Platform } from 'react-native';

/**
 * Ask the user to confirm an action. Resolves true when they confirm.
 *
 * Alert.alert with buttons is a no-op on react-native-web, so on web this
 * uses the browser's confirm dialog instead; without that, confirm-gated
 * actions (like Log Out) silently do nothing in the web build.
 */
export function confirmAction(title, message, { confirmText = 'OK', destructive = false } = {}) {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
