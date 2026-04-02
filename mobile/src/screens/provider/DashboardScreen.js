import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import api from '../../api/axios.instance';
import StarRating from '../../components/StarRating';
import ProviderBadge from '../../components/ProviderBadge';
import { colors, radius, shadows, typography } from '../../theme';

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const loadDashboard = async () => {
    setLoading(true);
    try { const { data } = await api.get('/provider/dashboard'); setStats(data.stats); setProfile(data.profile); }
    catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (!stats) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={colors.primary} />}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeLabel}>Dashboard</Text>
          <Text style={styles.welcomeName}>{user?.name || 'Provider'}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Rating Card */}
      {profile && (
        <View style={styles.ratingCard}>
          <View style={styles.ratingMain}>
            <Text style={styles.ratingNumber}>{parseFloat(profile.avg_rating).toFixed(1)}</Text>
            <View style={styles.ratingInfo}>
              <StarRating rating={profile.avg_rating} size={16} />
              <View style={styles.ratingMeta}>
                <Text style={styles.ratingMetaText}>{profile.total_jobs_done} jobs completed</Text>
                <ProviderBadge rating={profile.avg_rating} size="large" />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardWide]}>
          <View style={[styles.statIcon, { backgroundColor: colors.accentLight }]}>
            <Text style={{ fontSize: 20 }}>{'$'}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Total Earnings</Text>
            <Text style={[styles.statValue, { color: colors.accent }]}>${parseFloat(stats.total_earnings).toLocaleString()}</Text>
          </View>
        </View>

        <View style={[styles.statCard, styles.statCardWide]}>
          <View style={[styles.statIcon, { backgroundColor: colors.warningBg }]}>
            <Text style={{ fontSize: 20 }}>{'⏳'}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>${parseFloat(stats.pending_earnings).toLocaleString()}</Text>
          </View>
        </View>

        <StatTile label="Active Jobs" value={stats.active_jobs} color={colors.primary} bg={colors.primaryBg} />
        <StatTile label="Total Bids" value={stats.total_bids} color="#7C3AED" bg="#EDE9FE" />
        <StatTile label="Success Rate" value={`${stats.bid_success_rate}%`} color={colors.accent} bg={colors.accentLight} />
        <StatTile label="Accepted" value={stats.accepted_bids} color={colors.info} bg={colors.infoBg} />
      </View>
    </ScrollView>
  );
}

function StatTile({ label, value, color, bg }) {
  return (
    <View style={[styles.statTile, { backgroundColor: bg }]}>
      <Text style={[styles.statTileValue, { color }]}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { ...typography.bodySmall },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 16,
  },
  headerLeft: {},
  welcomeLabel: { ...typography.bodySmall, marginBottom: 2 },
  welcomeName: { ...typography.h1 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    ...shadows.md,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },

  ratingCard: {
    marginHorizontal: 16, padding: 20, borderRadius: radius.xl,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    ...shadows.md,
  },
  ratingMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ratingNumber: { fontSize: 44, fontWeight: '800', color: colors.text },
  ratingInfo: { gap: 6 },
  ratingMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingMetaText: { ...typography.bodySmall, fontSize: 13 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginTop: 8 },

  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, padding: 18, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  statCardWide: { width: '100%' },
  statIcon: {
    width: 48, height: 48, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { ...typography.caption, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },

  statTile: {
    width: '47%', padding: 18, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  statTileValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statTileLabel: { ...typography.caption, fontSize: 10 },
});
