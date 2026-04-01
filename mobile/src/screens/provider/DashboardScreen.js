import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import api from '../../api/axios.instance';
import ProviderBadge from '../../components/ProviderBadge';

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/dashboard');
      setStats(data.stats);
      setProfile(data.profile);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (!stats) {
    return <View style={styles.container}><Text style={styles.loading}>Loading dashboard...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} />}>
      {profile && (
        <View style={styles.profileCard}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingValue}>{parseFloat(profile.avg_rating).toFixed(1)}</Text>
            <StarRating rating={profile.avg_rating} />
            <ProviderBadge rating={profile.avg_rating} />
          </View>
          <Text style={styles.jobsCompleted}>{profile.total_jobs_done} jobs completed</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard label="Active Jobs" value={stats.active_jobs} color="#0984e3" />
        <StatCard label="Total Bids" value={stats.total_bids} color="#6c5ce7" />
        <StatCard label="Success Rate" value={`${stats.bid_success_rate}%`} color="#00b894" />
        <StatCard label="Earnings" value={`$${parseFloat(stats.total_earnings).toFixed(0)}`} color="#fdcb6e" textColor="#2d3436" />
        <StatCard label="Pending" value={`$${parseFloat(stats.pending_earnings).toFixed(0)}`} color="#fab1a0" textColor="#2d3436" />
        <StatCard label="Accepted" value={stats.accepted_bids} color="#74b9ff" />
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color, textColor = '#fff' }) {
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <Text style={[styles.statValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textColor, opacity: 0.8 }]}>{label}</Text>
    </View>
  );
}

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text key={i} style={{ fontSize: 18, color: i <= Math.round(rating) ? '#fdcb6e' : '#dfe6e9' }}>
        {i <= Math.round(rating) ? '\u2605' : '\u2606'}
      </Text>
    );
  }
  return <View style={{ flexDirection: 'row', marginLeft: 8 }}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loading: { textAlign: 'center', marginTop: 50, color: '#636e72' },
  profileCard: { margin: 16, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#dfe6e9' },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingValue: { fontSize: 28, fontWeight: 'bold', color: '#2d3436' },
  jobsCompleted: { marginTop: 4, fontSize: 14, color: '#636e72' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { width: '45%', margin: '2.5%', padding: 20, borderRadius: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 13, marginTop: 4 },
});
