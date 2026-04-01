import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}
