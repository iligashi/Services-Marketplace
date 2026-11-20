import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { type } from '../theme';
import StarRating from './StarRating';
import Avatar from './Avatar';
import { Button, Card, Pill, StatusPill, Tappable } from './ui';
import { money } from '../utils/categories';

const BADGE = {
  elite_pro: { icon: 'trophy', tone: 'gold' },
  top_rated: { icon: 'star', tone: 'accent' },
  verified: { icon: 'shield-checkmark', tone: 'primary' },
};

export default function BidCard({ bid, onAccept, onReject, onViewProfile }) {
  const { colors } = useTheme();
  const isPending = bid.status === 'pending';
  const badge = bid.badge ? BADGE[bid.badge.tier] : null;

  return (
    <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <Tappable onPress={onViewProfile} disabled={!onViewProfile} scaleTo={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={bid.provider_name} uri={bid.provider_avatar} size={50} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[type.headline, { color: colors.text, flexShrink: 1 }]} numberOfLines={1}>{bid.provider_name}</Text>
            {onViewProfile ? <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} /> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <StarRating rating={bid.avg_rating || 0} size={12} showValue />
            <Text style={[type.caption, { color: colors.textSecondary }]}>· {bid.total_jobs_done || 0} {Number(bid.total_jobs_done) === 1 ? 'job' : 'jobs'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[type.title2, { color: colors.text }]}>{money(bid.amount)}</Text>
          <Text style={[type.caption2, { color: colors.textTertiary }]}>OFFER</Text>
        </View>
      </Tappable>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        {badge ? <Pill label={bid.badge.label} icon={badge.icon} tone={badge.tone} size="sm" /> : null}
        {bid.estimated_hours ? <Pill label={`About ${bid.estimated_hours}h`} icon="time" tone="indigo" size="sm" /> : null}
        {bid.years_experience > 0 ? <Pill label={`${bid.years_experience} yrs experience`} icon="ribbon" tone="teal" size="sm" /> : null}
      </View>

      {bid.message ? (
        <View style={{ marginTop: 12, backgroundColor: colors.bubbleTheirs, borderRadius: 18, borderTopLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={[type.subhead, { color: colors.text }]}>{bid.message}</Text>
        </View>
      ) : null}

      {isPending ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Button title="Decline" variant="gray" size="md" onPress={onReject} flex />
          <Button title="Accept Offer" icon="checkmark" size="md" onPress={onAccept} style={{ flex: 1.6 }} />
        </View>
      ) : (
        <StatusPill status={bid.status} kind="bid" style={{ marginTop: 14 }} />
      )}
    </Card>
  );
}
