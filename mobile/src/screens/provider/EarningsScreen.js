import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import api from '../../api/axios.instance';

export default function EarningsScreen() {
  const [payments, setPayments] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/earnings');
      setPayments(data.payments);
      setTotalEarnings(data.payments.reduce((sum, p) => sum + parseFloat(p.provider_payout), 0));
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEarnings(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Earnings</Text>
        <Text style={styles.totalAmount}>${totalEarnings.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Payment History</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.paymentItem}>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>{item.job_title}</Text>
              <Text style={styles.paymentDate}>{new Date(item.released_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.paymentAmount}>+${parseFloat(item.provider_payout).toFixed(2)}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEarnings} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Loading...' : 'No earnings yet'}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  totalCard: { margin: 16, backgroundColor: '#00b894', padding: 24, borderRadius: 16, alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 4 },
  totalAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600', paddingHorizontal: 16, marginBottom: 8, color: '#2d3436' },
  paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: '500', color: '#2d3436' },
  paymentDate: { fontSize: 13, color: '#636e72', marginTop: 2 },
  paymentAmount: { fontSize: 18, fontWeight: 'bold', color: '#00b894' },
  empty: { textAlign: 'center', color: '#636e72', fontSize: 16, marginTop: 40 },
});
