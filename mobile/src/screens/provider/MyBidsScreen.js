import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMyBids, startWork, markJobComplete } from '../../api/jobs.api';
import { Screen, Card, Segmented, Button, StatusPill, IconTile, EmptyState, Appear } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { confirmAction } from '../../utils/dialogs';
import { categoryMeta, money } from '../../utils/categories';
import { successFeedback } from '../../utils/haptics';

function BidItem({ item, onStart, onComplete, onChat }) {
  const { colors } = useTheme();
  const cat = categoryMeta(item.category_slug || item.category_name);
  const won = item.status === 'accepted';

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile icon={cat.icon} tone={cat.tone} size={40} variant="soft" />
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: colors.text }]} numberOfLines={1}>{item.job_title}</Text>
          <Text style={[type.footnote, { color: colors.textSecondary }]}>{item.category_name || 'General'}</Text>
        </View>
        <StatusPill status={item.status} kind="bid" size="sm" />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14, backgroundColor: colors.fill, borderRadius: 14, paddingVertical: 10 }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[type.title3, { color: won ? colors.success : colors.text, fontWeight: '700' }]}>{money(item.amount)}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>Your bid</Text>
        </View>
        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[type.title3, { color: colors.text, fontWeight: '600' }]}>{item.budget ? money(item.budget) : '—'}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>Budget</Text>
        </View>
        <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator }} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[type.title3, { color: colors.text, fontWeight: '600' }]}>{item.estimated_hours ? `${item.estimated_hours}h` : '—'}</Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>Estimate</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <Text style={[type.footnote, { color: colors.textSecondary }]}>Job status</Text>
        <StatusPill status={item.job_status} size="sm" />
        {item.deadline ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <Ionicons name="calendar" size={12} color={colors.textSecondary} />
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        ) : null}
      </View>

      {won ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {item.job_status === 'assigned' ? (
            <Button title="Start Work" icon="play" size="md" onPress={onStart} style={{ flex: 1.4 }} />
          ) : null}
          {item.job_status === 'in_progress' ? (
            <Button title="Mark Complete" icon="checkmark-done" tone="success" size="md" onPress={onComplete} style={{ flex: 1.4 }} />
          ) : null}
          <Button title="Chat" icon="chatbubble" variant="tinted" size="md" onPress={onChat} flex />
        </View>
      ) : null}
    </Card>
  );
}

export default function MyBidsScreen() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigation = useNavigation();

  const loadBids = async () => {
    setLoading(true);
    try {
      const { data } = await getMyBids();
      setBids(data.bids);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadBids(); }, []);

  const handleStartWork = async (jobId) => {
    try {
      await startWork(jobId);
      successFeedback();
      Alert.alert('Started!', 'You can now work on this job.');
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start work');
    }
  };

  const handleMarkComplete = async (jobId) => {
    if (!(await confirmAction('Mark Complete', 'Mark this job as complete?', { confirmText: 'Complete' }))) return;
    try {
      await markJobComplete(jobId);
      successFeedback();
      Alert.alert('Completed!', 'The customer will be notified to confirm and release payment.');
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to mark complete');
    }
  };

  const filtered = filter === 'all' ? bids : bids.filter((b) => b.status === filter);
  const count = (status) => bids.filter((b) => b.status === status).length;
  const options = [
    { key: 'all', label: 'All', count: bids.length },
    { key: 'accepted', label: 'Won', count: count('accepted') },
    { key: 'pending', label: 'Pending', count: count('pending') },
    { key: 'rejected', label: 'Declined', count: count('rejected') },
  ];

  return (
    <Screen
      title="My Bids"
      subtitle={count('accepted') ? `${count('accepted')} won · ${count('pending')} waiting for a reply` : 'Track every offer you send'}
      header={<View style={{ paddingHorizontal: 16, paddingBottom: 16 }}><Segmented options={options} value={filter} onChange={setFilter} /></View>}
      data={filtered}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <BidItem
            item={item}
            onStart={() => handleStartWork(item.job_id)}
            onComplete={() => handleMarkComplete(item.job_id)}
            onChat={() => navigation.navigate('Chat', { jobId: item.job_id })}
          />
        </Appear>
      )}
      refreshing={loading && bids.length > 0}
      onRefresh={loadBids}
      ListEmptyComponent={!loading ? (
        <EmptyState
          icon="document-text"
          title={filter === 'all' ? 'No bids yet' : 'Nothing here'}
          message={filter === 'all' ? 'Browse open jobs and send your first offer.' : 'Bids with this status will appear here.'}
          actionLabel={filter === 'all' ? 'Browse jobs' : undefined}
          onAction={() => navigation.navigate('BrowseTab')}
        />
      ) : null}
    />
  );
}
