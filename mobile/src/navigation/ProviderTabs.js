import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BrowseJobsScreen from '../screens/provider/BrowseJobsScreen';
import SubmitBidScreen from '../screens/provider/SubmitBidScreen';
import MyBidsScreen from '../screens/provider/MyBidsScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import DashboardScreen from '../screens/provider/DashboardScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import FloatingTabBar from './FloatingTabBar';
import { TabBarProvider } from './TabBarContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackOptions = { headerShown: false, animation: 'slide_from_right' };

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="BrowseJobs" component={BrowseJobsScreen} />
      <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

function MyBidsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MyBids" component={MyBidsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

export default function ProviderTabs() {
  return (
    <TabBarProvider>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Today', tabBarIconName: ['sparkles', 'sparkles-outline'] }} />
        <Tab.Screen name="BrowseTab" component={BrowseStack} options={{ tabBarLabel: 'Browse', tabBarIconName: ['search', 'search-outline'] }} />
        <Tab.Screen name="MyBidsTab" component={MyBidsStack} options={{ tabBarLabel: 'My Bids', tabBarIconName: ['document-text', 'document-text-outline'] }} />
        <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: 'Earnings', tabBarIconName: ['wallet', 'wallet-outline'] }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIconName: ['person-circle', 'person-circle-outline'] }} />
      </Tab.Navigator>
    </TabBarProvider>
  );
}
