import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BrowseJobsScreen from '../screens/provider/BrowseJobsScreen';
import SubmitBidScreen from '../screens/provider/SubmitBidScreen';
import MyBidsScreen from '../screens/provider/MyBidsScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import DashboardScreen from '../screens/provider/DashboardScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import { shadows } from '../theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BrowseStack({ colors }) {
  const opts = {
    headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="BrowseJobs" component={BrowseJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubmitBid" component={SubmitBidScreen} options={{ title: 'Submit Bid' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
}

function MyBidsStack({ colors }) {
  const opts = {
    headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="MyBids" component={MyBidsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
}

export default function ProviderTabs() {
  const { colors } = useTheme();

  const headerOpts = {
    headerStyle: { backgroundColor: colors.card, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar || colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...shadows.md,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: true,
          title: 'Dashboard',
          ...headerOpts,
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          ),
        }}
      >
        {() => <BrowseStack colors={colors} />}
      </Tab.Screen>
      <Tab.Screen
        name="MyBidsTab"
        options={{
          tabBarLabel: 'My Bids',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={22} color={color} />
          ),
        }}
      >
        {() => <MyBidsStack colors={colors} />}
      </Tab.Screen>
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          headerShown: true,
          title: 'Earnings',
          ...headerOpts,
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile & Settings',
          ...headerOpts,
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
