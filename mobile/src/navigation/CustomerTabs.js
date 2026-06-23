import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/customer/HomeScreen';
import PostJobScreen from '../screens/customer/PostJobScreen';
import BidsScreen from '../screens/customer/BidsScreen';
import MyJobsScreen from '../screens/customer/MyJobsScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import ReviewScreen from '../screens/shared/ReviewScreen';
import JobDetailScreen from '../screens/customer/JobDetailScreen';
import { shadows } from '../theme';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack({ colors }) {
  const opts = {
    headerStyle: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} options={{ title: 'Bids' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave Review' }} />
    </Stack.Navigator>
  );
}

function MyJobsStack({ colors }) {
  const opts = {
    headerStyle: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { fontSize: 17, fontWeight: '700', color: colors.text },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
  return (
    <Stack.Navigator screenOptions={opts}>
      <Stack.Screen name="MyJobs" component={MyJobsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
      <Stack.Screen name="Bids" component={BidsScreen} options={{ title: 'Bids' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave Review' }} />
    </Stack.Navigator>
  );
}

export default function CustomerTabs() {
  const { colors } = useTheme();

  const headerOpts = {
    headerStyle: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0, shadowOpacity: 0 },
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
        name="HomeTab"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      >
        {() => <HomeStack colors={colors} />}
      </Tab.Screen>

      <Tab.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{
          headerShown: true,
          title: 'Post a Job',
          ...headerOpts,
          tabBarLabel: 'Post',
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: colors.primary,
              justifyContent: 'center', alignItems: 'center',
              marginBottom: Platform.OS === 'ios' ? 4 : 16,
              ...shadows.xl,
            }}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="MyJobsTab"
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={22} color={color} />
          ),
        }}
      >
        {() => <MyJobsStack colors={colors} />}
      </Tab.Screen>

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
