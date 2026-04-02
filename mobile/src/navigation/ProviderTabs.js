import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import BrowseJobsScreen from '../screens/provider/BrowseJobsScreen';
import SubmitBidScreen from '../screens/provider/SubmitBidScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import DashboardScreen from '../screens/provider/DashboardScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={tabStyles.iconWrap}>
    <View style={[tabStyles.iconBg, focused && tabStyles.iconBgActive]}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
    </View>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);

const screenOptions = {
  headerStyle: { backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 },
  headerTitleStyle: { fontSize: 17, fontWeight: '600', color: colors.text },
  headerTintColor: colors.primary,
  headerShadowVisible: false,
  headerBackTitleVisible: false,
};

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="BrowseJobs" component={BrowseJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SubmitBid" component={SubmitBidScreen} options={{ title: 'Submit Bid' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
    </Stack.Navigator>
  );
}

export default function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...shadows.md,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: true,
          title: 'Dashboard',
          ...screenOptions,
          tabBarIcon: ({ focused }) => <TabIcon icon="D" label="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="B" label="Jobs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{
          headerShown: true,
          title: 'Earnings',
          ...screenOptions,
          tabBarIcon: ({ focused }) => <TabIcon icon="$" label="Earnings" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          ...screenOptions,
          tabBarIcon: ({ focused }) => <TabIcon icon="P" label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  iconBg: {
    width: 36, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBgActive: { backgroundColor: colors.primaryBg },
  icon: { fontSize: 14, fontWeight: '800', color: colors.textTertiary },
  iconActive: { color: colors.primary },
  label: { fontSize: 10, fontWeight: '500', color: colors.textTertiary, marginTop: 2 },
  labelActive: { color: colors.primary, fontWeight: '600' },
});
