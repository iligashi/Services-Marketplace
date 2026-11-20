import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getPublicProfile, getUserReviews } from '../../api/users.api';
import Avatar from '../../components/Avatar';
import StarRating from '../../components/StarRating';
import { Screen, Card, Pill, Section, Row, EmptyState, Stat, Appear } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { timeAgo } from '../../utils/categories';

const BADGE_META = {
  elite_pro: { icon: 'trophy', tone: 'gold' },
  top_rated: { icon: 'star', tone: 'accent' },
  verified: { icon: 'shield-checkmark', tone: 'primary' },
};

function Label({ children }) {
  const { colors } = useTheme();
  return <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 32, marginTop: 24, marginBottom: 7 }]}>{children}</Text>;
}

export default function ProviderProfileScreen({ route }) {
  const { userId, name } = route.params;
  const { colors } = useTheme();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, r] = await Promise.all([getPublicProfile(userId), getUserReviews(userId)]);
        setProfile(p.data.user);
        setReviews(r.data.reviews);
        setSummary(r.data.summary);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [userId]);

  if (loading || !profile) {
    return (
      <Screen title={name || 'Profile'} large={false}>
        {loading
          ? <View style={{ paddingTop: 120, alignItems: 'center' }}><ActivityIndicator color={colors.textSecondary} /></View>
          : <EmptyState icon="person" tone="textSecondary" title="Profile unavailable" message="This provider's profile can't be shown right now." style={{ marginTop: 60 }} />}
      </Screen>
    );
  }

  let skills = [];
  if (profile.skills) {
    try { skills = Array.isArray(profile.skills) ? profile.skills : JSON.parse(profile.skills); } catch {}
  }
  const badge = profile.badge ? { ...BADGE_META[profile.badge.tier], label: profile.badge.label } : null;
  const rating = parseFloat(summary?.avg_rating || profile.avg_rating || 0);
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <Screen title={profile.name || name} large={false} titleOnScroll>
      {/* Hero */}
      <Appear style={{ alignItems: 'center', paddingTop: 8 }}>
        <LinearGradient colors={colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 4, borderRadius: 60 }}>
          <View style={{ padding: 3, borderRadius: 56, backgroundColor: colors.bg }}>
            <Avatar name={profile.name} uri={profile.avatar_url} size={100} />
          </View>
        </LinearGradient>
        <Text style={[type.title1, { color: colors.text, marginTop: 14 }]}>{profile.name || name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {badge ? <Pill label={badge.label} icon={badge.icon} tone={badge.tone} /> : null}
          <Text style={[type.footnote, { color: colors.textSecondary }]}>Member since {memberSince}</Text>
        </View>
      </Appear>

      <Appear index={1}>
        <Card style={{ marginHorizontal: 16, marginTop: 20, flexDirection: 'row', paddingVertical: 4 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
            <Text style={[type.title2, { color: colors.text }]}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
            <StarRating rating={rating} size={11} />
          </View>
          <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 14 }} />
          <Stat value={profile.total_jobs_done ?? 0} label="Jobs done" />
          <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 14 }} />
          <Stat value={summary?.total_reviews ?? reviews.length} label="Reviews" />
        </Card>
      </Appear>

      {profile.bio ? (
        <>
          <Label>About</Label>
          <Card style={{ marginHorizontal: 16 }}>
            <Text style={[type.body, { color: colors.text }]}>{profile.bio}</Text>
          </Card>
        </>
      ) : null}

      {skills.length > 0 ? (
        <>
          <Label>Skills</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16 }}>
            {skills.map((s, i) => <Pill key={i} label={s} tone="primary" />)}
          </View>
        </>
      ) : null}

      {profile.years_experience > 0 || profile.location_address ? (
        <Section separatorInset={58}>
          {profile.years_experience > 0 ? <Row icon="briefcase" iconTone="indigo" title={`${profile.years_experience} years`} subtitle="Experience" /> : null}
          {profile.location_address ? <Row icon="location" iconTone="error" title={profile.location_address} subtitle="Based in" /> : null}
        </Section>
      ) : null}

      <Label>{`Reviews${summary?.total_reviews ? ` (${summary.total_reviews})` : ''}`}</Label>
      {reviews.length === 0 ? (
        <Card style={{ marginHorizontal: 16 }}>
          <Text style={[type.subhead, { color: colors.textSecondary }]}>No reviews yet.</Text>
        </Card>
      ) : (
        reviews.map((rev, i) => (
          <Appear key={rev.id} index={i}>
            <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar name={rev.reviewer_name} uri={rev.reviewer_avatar} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.subhead, { color: colors.text, fontWeight: '600' }]}>{rev.reviewer_name}</Text>
                  <Text style={[type.caption, { color: colors.textSecondary }]} numberOfLines={1}>{rev.job_title} · {timeAgo(rev.created_at)}</Text>
                </View>
                <StarRating rating={rev.rating} size={12} />
              </View>
              {rev.comment ? <Text style={[type.subhead, { color: colors.text, marginTop: 10 }]}>{rev.comment}</Text> : null}
            </Card>
          </Appear>
        ))
      )}
    </Screen>
  );
}
