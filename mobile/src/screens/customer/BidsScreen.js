import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, RefreshControl, Platform } from 'react-native';
import { getBidsForJob, acceptBid, rejectBid } from '../../api/jobs.api';
import BidCard from '../../components/BidCard';
import { colors, typography } from '../../theme';

export default function BidsScreen({ route }) {
  const { jobId } = route.params;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBids = async () => {
    setLoading(true);
    try { const { data } = await getBidsForJob(jobId); setBids(data.bids); }
    catch { Alert.alert('Error', 'Failed to load bids'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBids(); }, []);

  const doAccept = async (bidId) => {
    try {
      await acceptBid(bidId);
      Alert.alert('Bid Accepted!', 'The provider has been notified.');
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept bid');
    }
  };

  const handleAccept = (bidId) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will assign the job to this provider. Other bids will be declined. Continue?');
      if (confirmed) doAccept(bidId);
    } else {
      Alert.alert('Accept Bid', 'This will assign the job to this provider. Other bids will be declined.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', style: 'default', onPress: () => doAccept(bidId) },
      ]);
    }
  };

  const handleReject = async (bidId) => {
    try { await rejectBid(bidId); loadBids(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const pendingCount = bids.filter(b => b.status === 'pending').length;

  return (
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BidCard bid={item} onAccept={() => handleAccept(item.id)} onReject={() => handleReject(item.id)} />
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadBids} tintColor={colors.primary} />}
        ListHeaderComponent={bids.length > 0 ? (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}</Text>
            {pendingCount > 0 && <Text style={styles.headerSub}>{pendingCount} awaiting your decision</Text>}
          </View>
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'💬'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Loading bids...' : 'No bids yet'}</Text>
            <Text style={styles.emptySubtitle}>Providers will start bidding soon</Text>
          </View>
        }
        contentContainerStyle={bids.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { ...typography.h2 },
  headerSub: { ...typography.bodySmall, marginTop: 4, color: colors.primary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall, textAlign: 'center' },
});
