import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Animated } from 'react-native';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { restoreAuth } from './src/store/authSlice';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { registerForPushNotifications } from './src/utils/push';

function AppContent() {
  const dispatch = useDispatch();
  const { isRestoring, user } = useSelector((state) => state.auth);
  const { colors, fadeAnim, isDark } = useTheme();

  useEffect(() => {
    dispatch(restoreAuth());
  }, []);

  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user?.id]);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Navigation background matches the palette so screen transitions never flash white
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.separator },
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
