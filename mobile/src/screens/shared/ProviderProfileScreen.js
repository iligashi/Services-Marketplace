import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPublicProfile, getUserReviews } from '../../api/users.api';
import Avatar from '../../components/Avatar';
import StarRating from '../../components/StarRating';
import { useTheme } from '../../context/ThemeContext';
import { radius, shadows } from '../../theme';

const BADGE_META = {
  elite_pro: { icon: 'trophy', label: 'Elite Pro' },
  top_rated: { icon: 'star', label: 'Top Rated' },
  verified: { icon: 'shield-checkmark', label: 'Verified' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, padding: 40 }}>
        <Ionicons name="person-remove-outline" size={40} color={colors.textTertiary} />
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginTop: 12 }}>Profile unavailable</Text>
      </View>
    );
  }

  let skills = [];
  if (profile.skills) {
    try { skills = Array.isArray(profile.skills) ? profile.skills : JSON.parse(profile.skills); } catch {}
  }
  const badge = profile.badge ? BADGE_META[profile.badge.tier] : null;
  const rating = parseFloat(summary?.avg_rating || profile.avg_rating || 0);
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />

      {/* Hero */}
      <View style={{ backgroundColor: colors.gradientStart, alignItems: 'center', paddingTop: 28, paddingBottom: 32, paddingHorizontal: 24 }}>
        <Avatar name={profile.name} uri={profile.avatar_url} size={92} ring />
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 14 }}>{profile.name || name}</Text>
        {badge ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}>
            <Ionicons name={badge.icon} size={13} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{badge.label}</Text>
          </View>
        ) : null}
        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 10 }}>Member since {memberSince}</Text>
      </View>

      {/* Stat strip */}
      <View style={{ flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: 16, marginTop: -20, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, ...shadows.md }}>
        <Stat colors={colors} value={rating > 0 ? rating.toFixed(1) : '—'} label="Rating" sub={<StarRating rating={rating} size={11} />} />
        <Divider colors={colors} />
        <Stat colors={colors} value={profile.total_jobs_done ?? 0} label="Jobs done" />
        <Divider colors={colors} />
        <Stat colors={colors} value={summary?.total_reviews ?? reviews.length} label="Reviews" />
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Section colors={colors} title="About">
          <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>{profile.bio}</Text>
        </Section>
      ) : null}

      {/* Skills */}
      {skills.length > 0 ? (
        <Section colors={colors} title="Skills">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((s, i) => (
              <View key={i} style={{ backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {profile.years_experience > 0 || profile.location_address ? (
        <Section colors={colors} title="Details">
          {profile.years_experience > 0 ? (
            <DetailRow colors={colors} icon="briefcase-outline" text={`${profile.years_experience} years of experience`} />
          ) : null}
          {profile.location_address ? (
            <DetailRow colors={colors} icon="location-outline" text={profile.location_address} />
          ) : null}
        </Section>
      ) : null}

      {/* Reviews */}
      <Section colors={colors} title={`Reviews${summary?.total_reviews ? ` (${summary.total_reviews})` : ''}`}>
        {reviews.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textTertiary }}>No reviews yet.</Text>
        ) : (
          reviews.map((rev) => (
            <View key={rev.id} style={{ backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Avatar name={rev.reviewer_name} uri={rev.reviewer_avatar} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{rev.reviewer_name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textTertiary }}>{rev.job_title} · {timeAgo(rev.created_at)}</Text>
                </View>
                <StarRating rating={rev.rating} size={13} />
              </View>
              {rev.comment ? (
                <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textSecondary }}>{rev.comment}</Text>
              ) : null}
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Stat({ colors, value, label, sub }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 18 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{value}</Text>
      {sub ? <View style={{ marginTop: 2 }}>{sub}</View> : null}
      <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 3, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function Divider({ colors }) {
  return <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 14 }} />;
}

function Section({ colors, title, children }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ colors, icon, text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={{ fontSize: 14, color: colors.textSecondary, flex: 1 }}>{text}</Text>
    </View>
  );
}
