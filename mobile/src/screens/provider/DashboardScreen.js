import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import api from '../../api/axios.instance';
import StarRating from '../../components/StarRating';
import Avatar from '../../components/Avatar';
import NotificationBell from '../../components/NotificationBell';
import { Screen, Card, IconTile, SectionHeader, EmptyState, Appear, Tappable, Section, Row } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows } from '../../theme';
import { greeting, money, todayLabel } from '../../utils/categories';

const BADGE_ICON = { elite_pro: 'trophy', top_rated: 'star', verified: 'shield-checkmark' };

function StatTile({ icon, tone, value, label, index }) {
  const { colors } = useTheme();
  return (
    <Appear index={index} style={{ width: '50%', padding: 6 }}>
      <Card style={{ padding: 16 }}>
        <IconTile icon={icon} tone={tone} size={34} variant="soft" />
        <Text style={[type.title1, { color: colors.text, marginTop: 12 }]}>{value}</Text>
        <Text style={[type.footnote, { color: colors.textSecondary }]}>{label}</Text>
      </Card>
    </Appear>
  );
}

export default function DashboardScreen({ navigation }) {
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

  const firstName = user?.name?.split(' ')[0] || 'there';
  const rating = parseFloat(profile?.avg_rating) || 0;
  const feeRate = profile?.fee_rate;

  return (
    <Screen
      eyebrow={todayLabel()}
      title={`${greeting()}, ${firstName}`}
      right={(
        <>
          <NotificationBell />
          <Tappable onPress={() => navigation.navigate('Profile')} scaleTo={0.9} accessibilityLabel="Profile">
            <Avatar name={user?.name} uri={user?.avatar_url} size={36} />
          </Tappable>
        </>
      )}
      refreshing={loading && !!stats}
      onRefresh={loadDashboard}
    >
      {!stats && !loading ? (
        <EmptyState icon="cloud-offline" tone="textSecondary" title="Couldn't load your dashboard" message="Check your connection and try again." actionLabel="Try again" onAction={loadDashboard} />
      ) : (
        <>
          {/* Wallet card */}
          <Appear>
            <LinearGradient
              colors={colors.gradientHero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[{ marginHorizontal: 16, borderRadius: 28, padding: 22, overflow: 'hidden' }, shadows.glow(colors.indigo)]}
            >
              <View style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <View style={{ position: 'absolute', left: -30, bottom: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)' }} />

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[type.footnote, { color: 'rgba(255,255,255,0.85)', fontWeight: '600' }]}>Total earned</Text>
                <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={{ fontSize: 44, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginTop: 2 }}>
                {money(stats?.total_earnings)}
              </Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, padding: 12 }}>
                  <Text style={[type.caption, { color: 'rgba(255,255,255,0.8)' }]}>Pending payout</Text>
                  <Text style={[type.title3, { color: '#fff', fontWeight: '700', marginTop: 2 }]}>{money(stats?.pending_earnings)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, padding: 12 }}>
                  <Text style={[type.caption, { color: 'rgba(255,255,255,0.8)' }]}>Your rating</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={[type.title3, { color: '#fff', fontWeight: '700' }]}>{rating > 0 ? rating.toFixed(1) : 'New'}</Text>
                    {rating > 0 ? <StarRating rating={rating} size={11} color="#fff" /> : null}
                  </View>
                </View>
              </View>

              {profile?.badge ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
                  <Ionicons name={BADGE_ICON[profile.badge.tier] || 'ribbon'} size={14} color="#fff" />
                  <Text style={[type.footnote, { color: '#fff', fontWeight: '600' }]}>{profile.badge.label}</Text>
                  <Text style={[type.footnote, { color: 'rgba(255,255,255,0.75)' }]}>· {profile.total_jobs_done} jobs done</Text>
                </View>
              ) : null}
            </LinearGradient>
          </Appear>

          <SectionHeader title="Performance" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
            <StatTile index={1} icon="briefcase" tone="primary" value={stats?.active_jobs ?? '—'} label="Active jobs" />
            <StatTile index={2} icon="document-text" tone="purple" value={stats?.total_bids ?? '—'} label="Bids sent" />
            <StatTile index={3} icon="trending-up" tone="success" value={stats ? `${stats.bid_success_rate}%` : '—'} label="Win rate" />
            <StatTile index={4} icon="checkmark-circle" tone="teal" value={stats?.accepted_bids ?? '—'} label="Bids won" />
          </View>

          <Section title="Grow your business" separatorInset={58}>
            <Row
              icon="pricetag"
              iconTone="indigo"
              title="Platform fee"
              subtitle={feeRate !== undefined && feeRate < 12 ? 'Reduced for your tier' : 'Get verified to pay 11%'}
              value={feeRate !== undefined ? `${feeRate}%` : '12%'}
            />
            <Row icon="search" iconTone="primary" title="Find new jobs" subtitle="Matched to your skills" chevron onPress={() => navigation.navigate('BrowseTab')} />
            <Row icon="person-circle" iconTone="accent" title="Polish your profile" subtitle="Skills and bio help you win more bids" chevron onPress={() => navigation.navigate('Profile')} />
          </Section>
        </>
      )}
    </Screen>
  );
}
