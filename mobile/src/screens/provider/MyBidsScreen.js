import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMyBids, startWork, markJobComplete } from '../../api/jobs.api';
import { colors, radius, shadows, typography, statusConfig } from '../../theme';

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
      Alert.alert('Started!', 'You can now work on this job.');
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start work');
    }
  };

  const handleMarkComplete = async (jobId) => {
    const doComplete = async () => {
      try {
        await markJobComplete(jobId);
        Alert.alert('Completed!', 'The customer will be notified to confirm and release payment.');
        loadBids();
      } catch (err) {
        Alert.alert('Error', err.response?.data?.error || 'Failed to mark complete');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Mark this job as complete?')) doComplete();
    } else {
      Alert.alert('Mark Complete', 'Mark this job as complete?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: doComplete },
      ]);
    }
  };

  const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter);

  const counts = {
    all: bids.length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    pending: bids.filter(b => b.status === 'pending').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
  };

  const renderBid = ({ item }) => {
    const statusColors = {
      pending: { color: colors.warning, bg: colors.warningBg },
      accepted: { color: colors.accent, bg: colors.accentLight },
      rejected: { color: colors.textTertiary, bg: colors.bgAlt },
    };
    const sc = statusColors[item.status] || statusColors.pending;
    const jobStatus = statusConfig[item.job_status] || statusConfig.open;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.job_title}</Text>
            <Text style={styles.category}>{item.category_name || 'Uncategorized'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Bid</Text>
            <Text style={styles.detailValue}>${parseFloat(item.amount).toLocaleString()}</Text>
          </View>
          {item.budget && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValueSmall}>${parseFloat(item.budget).toLocaleString()}</Text>
            </View>
          )}
          {item.estimated_hours && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Hours</Text>
              <Text style={styles.detailValueSmall}>{item.estimated_hours}h</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.jobStatusBadge, { backgroundColor: jobStatus.bg }]}>
            <Ionicons name={jobStatus.icon} size={11} color={jobStatus.color} style={{ marginRight: 4 }} />
            <Text style={[styles.jobStatusText, { color: jobStatus.color }]}>
              {jobStatus.label}
            </Text>
          </View>
        </View>

        {item.status === 'accepted' && (
          <View style={styles.actionRow}>
            {item.job_status === 'assigned' && (
              <TouchableOpacity style={styles.startBtn} onPress={() => handleStartWork(item.job_id)} activeOpacity={0.8}>
                <Text style={styles.startBtnText}>Start Work</Text>
              </TouchableOpacity>
            )}
            {item.job_status === 'in_progress' && (
              <TouchableOpacity style={styles.completeBtn} onPress={() => handleMarkComplete(item.job_id)} activeOpacity={0.8}>
                <Text style={styles.completeBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { jobId: item.job_id })} activeOpacity={0.8}>
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.deadline && (
          <Text style={styles.deadline}>
            Deadline: {new Date(item.deadline).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {['all', 'accepted', 'pending', 'rejected'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBids} tintColor={colors.primary} />}
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{'📋'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Loading...' : 'No bids yet'}</Text>
            <Text style={styles.emptySub}>Browse jobs and start bidding</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  filterBar: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    gap: 6, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
    backgroundColor: colors.bgAlt,
  },
  filterBtnActive: { backgroundColor: colors.primary },
  filterText: { ...typography.buttonSmall, fontSize: 12, color: colors.textSecondary },
  filterTextActive: { color: '#fff' },

  card: {
    backgroundColor: colors.white, marginHorizontal: 16, marginTop: 12,
    padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  jobTitle: { ...typography.h3, fontSize: 16, marginBottom: 2 },
  category: { ...typography.bodySmall, fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusText: { fontSize: 12, fontWeight: '700' },

  cardBody: { gap: 6 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { ...typography.bodySmall, fontSize: 13 },
  detailValue: { fontSize: 18, fontWeight: '800', color: colors.accent },
  detailValueSmall: { fontSize: 14, fontWeight: '600', color: colors.text },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  jobStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  jobStatusText: { fontSize: 11, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  startBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  startBtnText: { ...typography.buttonSmall, color: '#fff' },
  completeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.accent, alignItems: 'center',
  },
  completeBtnText: { ...typography.buttonSmall, color: '#fff' },
  chatBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center',
  },
  chatBtnText: { ...typography.buttonSmall, color: colors.primary },

  deadline: { ...typography.bodySmall, fontSize: 11, marginTop: 8 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySub: { ...typography.bodySmall, textAlign: 'center' },
});
