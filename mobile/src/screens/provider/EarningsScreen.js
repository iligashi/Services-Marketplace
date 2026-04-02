import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import api from '../../api/axios.instance';
import { colors, radius, shadows, typography } from '../../theme';

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
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadEarnings(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.paymentItem}>
            <View style={styles.paymentIcon}>
              <Text style={{ fontSize: 16 }}>{'$'}</Text>
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle} numberOfLines={1}>{item.job_title}</Text>
              <Text style={styles.paymentDate}>{new Date(item.released_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.paymentAmount}>{`+$${parseFloat(item.provider_payout).toFixed(2)}`}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadEarnings} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {/* Earnings Hero */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Earnings</Text>
              <Text style={styles.heroAmount}>{`$${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</Text>
              <Text style={styles.heroSub}>{payments.length} completed payments</Text>
            </View>
            {payments.length > 0 ? <Text style={styles.sectionTitle}>{'PAYMENT HISTORY'}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'💰'}</Text>
            <Text style={styles.emptyTitle}>{loading ? 'Loading...' : 'No earnings yet'}</Text>
            <Text style={styles.emptySubtitle}>Complete jobs to start earning</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  heroCard: {
    margin: 16, padding: 28, borderRadius: radius.xl,
    backgroundColor: colors.primary, alignItems: 'center', ...shadows.lg,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  heroAmount: { color: '#fff', fontSize: 42, fontWeight: '800', letterSpacing: -1 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 },

  sectionTitle: { ...typography.caption, paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },

  paymentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: 16, marginBottom: 8,
    padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  paymentIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: { flex: 1 },
  paymentTitle: { ...typography.body, fontWeight: '600', fontSize: 14, marginBottom: 2 },
  paymentDate: { ...typography.bodySmall, fontSize: 12 },
  paymentAmount: { fontSize: 17, fontWeight: '800', color: colors.accent },

  emptyState: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...typography.h3, marginBottom: 8 },
  emptySubtitle: { ...typography.bodySmall },
});
