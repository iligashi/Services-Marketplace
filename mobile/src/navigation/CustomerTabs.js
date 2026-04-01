import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import HomeScreen from '../screens/customer/HomeScreen';
import PostJobScreen from '../screens/customer/PostJobScreen';
import BidsScreen from '../screens/customer/BidsScreen';
import MyJobsScreen from '../screens/customer/MyJobsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import JobDetailScreen from '../screens/customer/JobDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Browse Services' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} options={{ title: 'Bids' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave Review' }} />
    </Stack.Navigator>
  );
}

function MyJobsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MyJobs" component={MyJobsScreen} options={{ title: 'My Jobs' }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

export default function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack}
        options={{ tabBarLabel: 'Home', tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="PostJob" component={PostJobScreen}
        options={{ tabBarLabel: 'Post Job', tabBarIcon: () => <Text>➕</Text>, headerShown: true, title: 'Post a Job' }} />
      <Tab.Screen name="MyJobsTab" component={MyJobsStack}
        options={{ tabBarLabel: 'My Jobs', tabBarIcon: () => <Text>📋</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text>, headerShown: true }} />
    </Tab.Navigator>
  );
}
