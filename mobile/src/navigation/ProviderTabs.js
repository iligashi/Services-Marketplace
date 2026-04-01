import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import BrowseJobsScreen from '../screens/provider/BrowseJobsScreen';
import SubmitBidScreen from '../screens/provider/SubmitBidScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import DashboardScreen from '../screens/provider/DashboardScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BrowseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseJobs" component={BrowseJobsScreen} options={{ title: 'Nearby Jobs' }} />
      <Stack.Screen name="SubmitBid" component={SubmitBidScreen} options={{ title: 'Submit Bid' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
}

export default function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text>📊</Text>, headerShown: true }} />
      <Tab.Screen name="BrowseTab" component={BrowseStack}
        options={{ tabBarLabel: 'Jobs', tabBarIcon: () => <Text>🔍</Text> }} />
      <Tab.Screen name="Earnings" component={EarningsScreen}
        options={{ tabBarLabel: 'Earnings', tabBarIcon: () => <Text>💰</Text>, headerShown: true }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text>, headerShown: true }} />
    </Tab.Navigator>
  );
}
