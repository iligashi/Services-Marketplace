import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import LoginScreen from '../screens/shared/LoginScreen';
import RegisterScreen from '../screens/shared/RegisterScreen';
import CustomerTabs from './CustomerTabs';
import ProviderTabs from './ProviderTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'provider' ? (
        <Stack.Screen name="ProviderMain" component={ProviderTabs} />
      ) : (
        <Stack.Screen name="CustomerMain" component={CustomerTabs} />
      )}
    </Stack.Navigator>
  );
}
