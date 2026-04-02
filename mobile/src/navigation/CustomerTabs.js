import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/customer/HomeScreen';
import PostJobScreen from '../screens/customer/PostJobScreen';
import BidsScreen from '../screens/customer/BidsScreen';
import MyJobsScreen from '../screens/customer/MyJobsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import JobDetailScreen from '../screens/customer/JobDetailScreen';
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

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} options={{ title: 'Bids' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave Review' }} />
    </Stack.Navigator>
  );
}

function MyJobsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="MyJobs" component={MyJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} options={{ title: 'Bids' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave Review' }} />
    </Stack.Navigator>
  );
}

export default function CustomerTabs() {
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
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="H" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          headerShown: true,
          title: 'Post a Job',
          ...screenOptions,
          tabBarIcon: ({ focused }) => (
            <View style={tabStyles.postBtnWrap}>
              <View style={tabStyles.postBtn}>
                <Text style={tabStyles.postBtnText}>+</Text>
              </View>
              <Text style={[tabStyles.label, { color: colors.primary, marginTop: 4 }]}>Post</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyJobsTab"
        component={MyJobsStack}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="J" label="My Jobs" focused={focused} />,
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
  postBtnWrap: { alignItems: 'center', marginTop: -8 },
  postBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    ...shadows.md,
  },
  postBtnText: { color: '#fff', fontSize: 24, fontWeight: '600', marginTop: -2 },
});
