import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { getBidsForJob, acceptBid, rejectBid } from '../../api/jobs.api';
import BidCard from '../../components/BidCard';
import { Screen, EmptyState, Appear } from '../../components/ui';
import { confirmAction } from '../../utils/dialogs';
import { successFeedback } from '../../utils/haptics';

export default function BidsScreen({ route, navigation }) {
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
      successFeedback();
      Alert.alert('Bid Accepted!', 'The provider has been notified.');
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to accept bid');
    }
  };

  const handleAccept = async (bidId) => {
    if (await confirmAction('Accept Bid', 'This will assign the job to this provider. Other bids will be declined.', { confirmText: 'Accept' })) {
      doAccept(bidId);
    }
  };

  const handleReject = async (bidId) => {
    try { await rejectBid(bidId); loadBids(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const pendingCount = bids.filter((b) => b.status === 'pending').length;
  const lowest = bids.length ? Math.min(...bids.map((b) => parseFloat(b.amount) || 0)) : 0;

  return (
    <Screen
      title="Offers"
      subtitle={bids.length
        ? `${bids.length} ${bids.length === 1 ? 'offer' : 'offers'} · from $${lowest.toLocaleString()}${pendingCount ? ` · ${pendingCount} waiting for you` : ''}`
        : undefined}
      data={bids}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <BidCard
            bid={item}
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleReject(item.id)}
            onViewProfile={() => navigation.navigate('ProviderProfile', { userId: item.provider_id, name: item.provider_name })}
          />
        </Appear>
      )}
      refreshing={loading && bids.length > 0}
      onRefresh={loadBids}
      ListEmptyComponent={!loading ? (
        <EmptyState icon="chatbubbles" title="No offers yet" message="Local pros usually respond within a few hours. We'll notify you." />
      ) : null}
    />
  );
}
