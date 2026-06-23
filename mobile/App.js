import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar, ActivityIndicator, View, Animated } from 'react-native';
import { restoreAuth } from './src/store/authSlice';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function AppContent() {
  const dispatch = useDispatch();
  const { isRestoring } = useSelector((state) => state.auth);
  const { colors, fadeAnim, isDark } = useTheme();

  useEffect(() => {
    dispatch(restoreAuth());
  }, []);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.gradientStart}
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}
