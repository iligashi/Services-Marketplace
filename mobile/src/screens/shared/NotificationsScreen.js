import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../store/notificationSlice';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows } from '../../theme';

const TYPE_ICON = {
  new_bid: 'pricetag',
  bid_accepted: 'checkmark-circle',
  completion_pending: 'time',
  job_completed: 'checkmark-done-circle',
  dispute_raised: 'alert-circle',
  new_message: 'chatbubble-ellipses',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const handlePress = (item) => {
    if (!item.is_read) dispatch(markNotificationRead(item.id));
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: item.is_read ? colors.card : colors.primaryBg,
        padding: 16, borderRadius: radius.lg, marginHorizontal: 16, marginVertical: 6,
        borderWidth: 1, borderColor: item.is_read ? colors.border : colors.primaryBorder,
        ...shadows.xs,
      }}
      onPress={() => handlePress(item)}
      activeOpacity={0.75}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: item.is_read ? colors.bgAlt : colors.primary,
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Ionicons name={TYPE_ICON[item.type] || 'notifications'} size={18} color={item.is_read ? colors.textTertiary : '#fff'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 }}>{item.title}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>{item.message}</Text>
        <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6 }}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 }} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {unreadCount > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={() => dispatch(markAllNotificationsRead())} activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700' }}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchNotifications())} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingTop: 8, paddingBottom: 24 }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="notifications-off-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 }}>No notifications yet</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>We'll let you know when something happens</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
