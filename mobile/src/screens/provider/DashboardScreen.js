import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api from '../../api/axios.instance';
import StarRating from '../../components/StarRating';
import { radius, shadows } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from '../../components/NotificationBell';

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/provider/dashboard');
      setStats(data.stats);
      setProfile(data.profile);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadDashboard(); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!stats && !loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: colors.bg }}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textTertiary} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 8, textAlign: 'center' }}>Couldn't load dashboard</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>Pull down to retry</Text>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDashboard} tintColor={colors.primary} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header banner */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: colors.gradientStart, padding: 24, paddingTop: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>{getGreeting()},</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 2, marginBottom: 8 }}>{user?.name?.split(' ')[0] || 'Provider'}</Text>
          {profile?.avg_rating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StarRating rating={profile.avg_rating} size={14} />
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{parseFloat(profile.avg_rating).toFixed(1)} · {profile.total_jobs_done} jobs</Text>
              {profile.badge ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <Ionicons name={profile.badge.tier === 'elite_pro' ? 'trophy' : profile.badge.tier === 'top_rated' ? 'star' : 'shield-checkmark'} size={11} color="#fff" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{profile.badge.label}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {profile?.fee_rate !== undefined ? (
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              Platform fee: {profile.fee_rate}% {profile.fee_rate < 12 ? '(reduced for your tier)' : ''}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <NotificationBell light />
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
        </View>
      </View>

      {/* Earnings cards */}
      <View style={{ flexDirection: 'row', gap: 12, margin: 16, marginBottom: 8 }}>
        <View style={{ flex: 1, padding: 18, borderRadius: radius.xl, backgroundColor: colors.primary, ...shadows.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="wallet-outline" size={22} color="#fff" />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Total Earnings</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>${parseFloat(stats?.total_earnings || 0).toLocaleString()}</Text>
        </View>
        <View style={{ flex: 1, padding: 18, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...shadows.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="hourglass-outline" size={22} color={colors.warning} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>Pending</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.warning }}>${parseFloat(stats?.pending_earnings || 0).toLocaleString()}</Text>
        </View>
      </View>

      {/* Stats grid */}
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginHorizontal: 16, marginTop: 8, marginBottom: 12 }}>Performance</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginBottom: 24 }}>
        <StatCard icon="briefcase" label="Active Jobs" value={stats?.active_jobs ?? '—'} color={colors.primary} bg={colors.primaryBg} textColor={colors.textSecondary} />
        <StatCard icon="document-text" label="Total Bids" value={stats?.total_bids ?? '—'} color="#7C3AED" bg="#EDE9FE" textColor={colors.textSecondary} />
        <StatCard icon="trending-up" label="Success Rate" value={stats ? `${stats.bid_success_rate}%` : '—'} color={colors.success} bg={colors.successBg} textColor={colors.textSecondary} />
        <StatCard icon="checkmark-circle" label="Accepted" value={stats?.accepted_bids ?? '—'} color={colors.info} bg={colors.infoBg} textColor={colors.textSecondary} />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, bg, textColor }) {
  return (
    <View style={{ width: '47%', padding: 18, borderRadius: radius.xl, marginHorizontal: 4, backgroundColor: bg }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: color + '22' }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 4, color }}>{value}</Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>{label}</Text>
    </View>
  );
}
