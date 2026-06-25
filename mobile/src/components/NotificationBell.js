import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../store/notificationSlice';

export default function NotificationBell({ light }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.notifications);
  const unreadCount = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 30000);
    return () => clearInterval(interval);
  }, []);

  const iconColor = light ? '#fff' : undefined;
  const bg = light ? 'rgba(255,255,255,0.2)' : undefined;
  const border = light ? 'rgba(255,255,255,0.4)' : undefined;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: bg, justifyContent: 'center', alignItems: 'center',
        borderWidth: light ? 2 : 0, borderColor: border,
      }}
      activeOpacity={0.75}
    >
      <Ionicons name="notifications-outline" size={22} color={iconColor || '#0F172A'} />
      {unreadCount > 0 ? (
        <View style={{
          position: 'absolute', top: 4, right: 4,
          minWidth: 16, height: 16, borderRadius: 8,
          backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
          paddingHorizontal: 3, borderWidth: 1.5, borderColor: light ? '#1E3A8A' : '#fff',
        }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
