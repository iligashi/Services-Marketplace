import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { type } from '../theme';
import { Card, IconTile, StatusPill } from './ui';
import { categoryMeta, timeAgo, money } from '../utils/categories';
import { tapFeedback } from '../utils/haptics';

function Meta({ icon, text, color }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
      <Ionicons name={icon} size={13} color={color || colors.textSecondary} />
      <Text style={[type.caption, { color: color || colors.textSecondary }]} numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function JobCard({ job, onPress, showBidCount, showDistance, saved, onToggleSave }) {
  const { colors } = useTheme();
  const cat = categoryMeta(job.category_slug || job.category_name);

  return (
    <Card onPress={onPress} style={{ marginHorizontal: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <IconTile icon={cat.icon} tone={cat.tone} size={44} variant="soft" />
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: colors.text }]} numberOfLines={2}>{job.title}</Text>
          <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {[job.category_name, timeAgo(job.created_at)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {job.budget ? (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[type.title3, { color: colors.text, fontWeight: '700' }]}>{money(job.budget)}</Text>
            <Text style={[type.caption2, { color: colors.textTertiary }]}>BUDGET</Text>
          </View>
        ) : null}
      </View>

      {job.description ? (
        <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 12 }]} numberOfLines={2}>{job.description}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {job.location_address ? <Meta icon="location" text={job.location_address} /> : null}
          {showDistance && job.distance ? (
            <Meta icon="navigate" text={`${parseFloat(job.distance).toFixed(1)} km`} color={colors.primary} />
          ) : null}
          {showBidCount && job.bid_count !== undefined ? (
            <Meta icon="people" text={`${job.bid_count} ${Number(job.bid_count) === 1 ? 'bid' : 'bids'}`} color={colors.primary} />
          ) : null}
        </View>
        <StatusPill status={job.status} size="sm" />
        {onToggleSave ? (
          <Pressable
            hitSlop={10}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save job'}
            onPress={() => { tapFeedback(); onToggleSave(); }}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={21} color={saved ? colors.primary : colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
