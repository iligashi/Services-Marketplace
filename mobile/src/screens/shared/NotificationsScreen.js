import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../store/notificationSlice';
import { Screen, Card, IconTile, NavButton, EmptyState, Appear } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { timeAgo } from '../../utils/categories';

const TYPE_META = {
  new_bid: { icon: 'pricetag', tone: 'primary' },
  bid_accepted: { icon: 'checkmark-circle', tone: 'success' },
  completion_pending: { icon: 'time', tone: 'warning' },
  job_completed: { icon: 'checkmark-done', tone: 'success' },
  dispute_raised: { icon: 'alert-circle', tone: 'error' },
  new_message: { icon: 'chatbubble-ellipses', tone: 'indigo' },
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const renderItem = ({ item, index }) => {
    const meta = TYPE_META[item.type] || { icon: 'notifications', tone: 'primary' };
    const unread = !item.is_read;
    return (
      <Appear index={index}>
        <Card
          onPress={() => { if (unread) dispatch(markNotificationRead(item.id)); }}
          style={{ marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', gap: 12, padding: 14 }}
        >
          <IconTile icon={meta.icon} tone={meta.tone} size={40} variant={unread ? 'solid' : 'soft'} style={{ borderRadius: 20 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[type.subhead, { color: colors.text, fontWeight: unread ? '700' : '500', flex: 1 }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[type.caption, { color: colors.textTertiary }]}>{timeAgo(item.created_at)}</Text>
            </View>
            <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 2 }]}>{item.message}</Text>
          </View>
          {unread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary, alignSelf: 'center' }} /> : null}
        </Card>
      </Appear>
    );
  };

  return (
    <Screen
      title="Notifications"
      subtitle={unreadCount ? `${unreadCount} unread` : 'You\'re all caught up'}
      right={unreadCount > 0 ? <NavButton label="Read all" onPress={() => dispatch(markAllNotificationsRead())} /> : null}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      refreshing={loading && items.length > 0}
      onRefresh={() => dispatch(fetchNotifications())}
      ListEmptyComponent={!loading ? (
        <EmptyState icon="notifications" title="No notifications yet" message="We'll let you know when there's news about your jobs." />
      ) : null}
    />
  );
}
