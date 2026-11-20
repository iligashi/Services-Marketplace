import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/customer/HomeScreen';
import PostJobScreen from '../screens/customer/PostJobScreen';
import BidsScreen from '../screens/customer/BidsScreen';
import MyJobsScreen from '../screens/customer/MyJobsScreen';
import JobDetailScreen from '../screens/customer/JobDetailScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import FloatingTabBar from './FloatingTabBar';
import { TabBarProvider } from './TabBarContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Screens draw their own glass navigation bar, so native headers are off
const stackOptions = { headerShown: false, animation: 'slide_from_right' };

function JobScreens() {
  return (
    <>
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="Bids" component={BidsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
    </>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Home" component={HomeScreen} />
      {JobScreens()}
    </Stack.Navigator>
  );
}

function MyJobsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MyJobs" component={MyJobsScreen} />
      {JobScreens()}
    </Stack.Navigator>
  );
}

export default function CustomerTabs() {
  return (
    <TabBarProvider>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
        <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home', tabBarIconName: ['home', 'home-outline'] }} />
        <Tab.Screen name="PostJob" component={PostJobScreen} options={{ tabBarLabel: 'Post', tabBarAccent: true }} />
        <Tab.Screen name="MyJobsTab" component={MyJobsStack} options={{ tabBarLabel: 'My Jobs', tabBarIconName: ['briefcase', 'briefcase-outline'] }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIconName: ['person-circle', 'person-circle-outline'] }} />
      </Tab.Navigator>
    </TabBarProvider>
  );
}
