import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../store/notificationSlice';
import { NavButton } from './ui';

export default function NotificationBell() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.notifications);
  const unreadCount = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    dispatch(fetchNotifications());
    const interval = setInterval(() => dispatch(fetchNotifications()), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NavButton
      icon={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
      onPress={() => navigation.navigate('Notifications')}
      badge={unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null}
      accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
    />
  );
}
