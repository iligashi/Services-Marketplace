import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, shadows, typography, statusConfig } from '../theme';

export default function JobCard({ job, onPress, showBidCount, showDistance }) {
  const status = statusConfig[job.status] || statusConfig.open;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {job.category_name ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{job.category_name}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusDot, { color: status.color }]}>{status.icon}</Text>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        {job.budget ? (
          <Text style={styles.budget}>{`$${parseFloat(job.budget).toLocaleString()}`}</Text>
        ) : null}
      </View>

      {/* Title & Description */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{job.description}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          {job.location_address ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>{'\u25CB'}</Text>
              <Text style={styles.metaText} numberOfLines={1}>{job.location_address}</Text>
            </View>
          ) : null}
          {showDistance && job.distance ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>{'\u2192'}</Text>
              <Text style={[styles.metaText, { color: colors.primary }]}>{`${parseFloat(job.distance).toFixed(1)} km`}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footerRight}>
          {showBidCount && job.bid_count !== undefined ? (
            <View style={styles.bidBadge}>
              <Text style={styles.bidCount}>{String(job.bid_count)}</Text>
              <Text style={styles.bidLabel}>{job.bid_count === 1 ? 'bid' : 'bids'}</Text>
            </View>
          ) : null}
          <Text style={styles.timeAgo}>{timeAgo(job.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6,
    padding: 18, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  categoryBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  categoryText: { ...typography.caption, color: colors.primary, fontSize: 10 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, gap: 4 },
  statusDot: { fontSize: 8 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  budget: { fontSize: 20, fontWeight: '800', color: colors.accent },

  title: { ...typography.h3, fontSize: 17, marginBottom: 4, lineHeight: 23 },
  description: { ...typography.bodySmall, lineHeight: 20, marginBottom: 14 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  metaRow: { flex: 1, gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 10, color: colors.textTertiary },
  metaText: { ...typography.bodySmall, fontSize: 12 },

  footerRight: { alignItems: 'flex-end', gap: 4 },
  bidBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  bidCount: { fontSize: 16, fontWeight: '800', color: colors.primary },
  bidLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: '500' },
  timeAgo: { fontSize: 11, color: colors.textTertiary },
});
