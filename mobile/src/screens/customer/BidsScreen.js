import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getBidsForJob, acceptBid, rejectBid } from '../../api/jobs.api';
import BidCard from '../../components/BidCard';

export default function BidsScreen({ route }) {
  const { jobId } = route.params;
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    try {
      const { data } = await getBidsForJob(jobId);
      setBids(data.bids);
    } catch (err) {
      Alert.alert('Error', 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (bidId) => {
    Alert.alert('Accept Bid', 'Accept this bid and assign the job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept', onPress: async () => {
          try {
            await acceptBid(bidId);
            Alert.alert('Success', 'Bid accepted!');
            loadBids();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed');
          }
        },
      },
    ]);
  };

  const handleReject = async (bidId) => {
    try {
      await rejectBid(bidId);
      loadBids();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={bids}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BidCard bid={item} onAccept={() => handleAccept(item.id)} onReject={() => handleReject(item.id)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No bids yet'}</Text>}
        contentContainerStyle={bids.length === 0 && styles.emptyContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  empty: { textAlign: 'center', color: '#636e72', fontSize: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
