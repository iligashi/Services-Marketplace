import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '../theme';

const STATUS = {
  open: { label: 'Open', color: '#10B981', bg: '#D1FAE5', icon: 'radio-button-on' },
  assigned: { label: 'Assigned', color: '#2563EB', bg: '#DBEAFE', icon: 'person-circle' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: '#FEF3C7', icon: 'time' },
  completed: { label: 'Completed', color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-done-circle' },
  disputed: { label: 'Disputed', color: '#EF4444', bg: '#FEE2E2', icon: 'alert-circle' },
  cancelled: { label: 'Cancelled', color: '#64748B', bg: '#F1F5F9', icon: 'close-circle' },
};

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

export default function JobCard({ job, onPress, showBidCount, showDistance }) {
  const status = STATUS[job.status] || STATUS.open;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Top row: category + budget */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          {job.category_name ? (
            <View style={styles.catBadge}>
              <Text style={styles.catText}>{job.category_name}</Text>
            </View>
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={10} color={status.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        {job.budget ? (
          <View style={styles.budgetWrap}>
            <Text style={styles.budgetCurrency}>$</Text>
            <Text style={styles.budgetAmount}>{parseFloat(job.budget).toLocaleString()}</Text>
          </View>
        ) : null}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

      {/* Description */}
      <Text style={styles.desc} numberOfLines={2}>{job.description}</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {job.location_address ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.metaText} numberOfLines={1}>{job.location_address}</Text>
            </View>
          ) : null}
          {showDistance && job.distance ? (
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={13} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>{parseFloat(job.distance).toFixed(1)} km</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footerRight}>
          {showBidCount && job.bid_count !== undefined ? (
            <View style={styles.bidBadge}>
              <Ionicons name="people-outline" size={13} color={colors.primary} />
              <Text style={styles.bidCount}>{job.bid_count} {job.bid_count === 1 ? 'bid' : 'bids'}</Text>
            </View>
          ) : null}
          <View style={styles.timeWrap}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.timeText}>{timeAgo(job.created_at)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 16, marginVertical: 6,
    padding: 16, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    ...shadows.sm,
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  topLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, marginRight: 8 },

  catBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.primaryBorder,
  },
  catText: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 0.2 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  budgetWrap: { flexDirection: 'row', alignItems: 'baseline' },
  budgetCurrency: { fontSize: 14, fontWeight: '700', color: colors.success, marginRight: 1 },
  budgetAmount: { fontSize: 22, fontWeight: '800', color: colors.success },

  title: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22, marginBottom: 6 },
  desc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerLeft: { flex: 1, gap: 4 },
  footerRight: { alignItems: 'flex-end', gap: 4 },

  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textTertiary, fontWeight: '500' },

  bidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bidCount: { fontSize: 12, fontWeight: '700', color: colors.primary },

  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  timeText: { fontSize: 11, color: colors.textTertiary },
});
