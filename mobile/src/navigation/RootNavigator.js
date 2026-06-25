import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/shared/LoginScreen';
import RegisterScreen from '../screens/shared/RegisterScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProviderProfileScreen from '../screens/shared/ProviderProfileScreen';
import CustomerTabs from './CustomerTabs';
import ProviderTabs from './ProviderTabs';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useSelector((state) => state.auth);
  const { colors } = useTheme();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          {user.role === 'provider' ? (
            <Stack.Screen name="ProviderMain" component={ProviderTabs} />
          ) : (
            <Stack.Screen name="CustomerMain" component={CustomerTabs} />
          )}
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{
              headerShown: true,
              title: 'Notifications',
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text, fontWeight: '700' },
              headerTintColor: colors.primary,
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="ProviderProfile"
            component={ProviderProfileScreen}
            options={{
              headerShown: true,
              title: 'Provider Profile',
              headerStyle: { backgroundColor: colors.card },
              headerTitleStyle: { color: colors.text, fontWeight: '700' },
              headerTintColor: colors.primary,
              headerShadowVisible: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
