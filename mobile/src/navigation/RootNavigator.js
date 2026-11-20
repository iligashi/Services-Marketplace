import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/shared/LoginScreen';
import RegisterScreen from '../screens/shared/RegisterScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import ProviderProfileScreen from '../screens/shared/ProviderProfileScreen';
import CustomerTabs from './CustomerTabs';
import ProviderTabs from './ProviderTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          {user.role === 'provider' ? (
            <Stack.Screen name="ProviderMain" component={ProviderTabs} options={{ animation: 'fade' }} />
          ) : (
            <Stack.Screen name="CustomerMain" component={CustomerTabs} options={{ animation: 'fade' }} />
          )}
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
