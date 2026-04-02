import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StarRating from './StarRating';
import ProviderBadge from './ProviderBadge';
import { colors, radius, shadows, typography } from '../theme';

export default function BidCard({ bid, onAccept, onReject }) {
  const isPending = bid.status === 'pending';

  return (
    <View style={styles.card}>
      {/* Provider Info */}
      <View style={styles.providerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{bid.provider_name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <View style={styles.providerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>{bid.provider_name}</Text>
            <ProviderBadge rating={bid.avg_rating} />
          </View>
          <View style={styles.statsRow}>
            <StarRating rating={bid.avg_rating || 0} size={12} showValue />
            <View style={styles.statDivider} />
            <Text style={styles.statText}>{bid.total_jobs_done || 0} jobs</Text>
            {bid.years_experience > 0 && (
              <>
                <View style={styles.statDivider} />
                <Text style={styles.statText}>{bid.years_experience}yr exp</Text>
              </>
            )}
            {bid.id_verified && (
              <>
                <View style={styles.statDivider} />
                <Text style={[styles.statText, { color: colors.accent }]}>{'\u2713'} Verified</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Bid</Text>
          <Text style={styles.amount}>${parseFloat(bid.amount).toLocaleString()}</Text>
        </View>
      </View>

      {/* Message */}
      {bid.message && (
        <View style={styles.messageBox}>
          <Text style={styles.message}>{bid.message}</Text>
        </View>
      )}

      {/* Details */}
      {bid.estimated_hours && (
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'\u23F1'}</Text>
          <Text style={styles.detailText}>Estimated {bid.estimated_hours} hours</Text>
        </View>
      )}

      {/* Actions */}
      {isPending && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.7}>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
            <Text style={styles.acceptText}>Accept Bid</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status for non-pending */}
      {!isPending && (
        <View style={[
          styles.statusBadge,
          { backgroundColor: bid.status === 'accepted' ? colors.successBg : colors.bgAlt }
        ]}>
          <Text style={[
            styles.statusText,
            { color: bid.status === 'accepted' ? colors.accent : colors.textTertiary }
          ]}>
            {bid.status === 'accepted' ? '\u2713 Accepted' : 'Declined'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, marginHorizontal: 16, marginVertical: 6,
    padding: 18, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },

  providerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48, height: 48, borderRadius: radius.xl,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  providerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  providerName: { ...typography.h3, fontSize: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { ...typography.bodySmall, fontSize: 11 },
  statDivider: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border },

  amountContainer: { alignItems: 'flex-end' },
  amountLabel: { ...typography.caption, fontSize: 10, marginBottom: 2 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.accent },

  messageBox: {
    backgroundColor: colors.bgAlt, padding: 14, borderRadius: radius.md,
    marginTop: 14, borderLeftWidth: 3, borderLeftColor: colors.primaryLight,
  },
  message: { ...typography.bodySmall, fontSize: 14, lineHeight: 20, color: colors.text },

  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  detailIcon: { fontSize: 14 },
  detailText: { ...typography.bodySmall, color: colors.primary, fontWeight: '500' },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  rejectBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  rejectText: { ...typography.buttonSmall, color: colors.textSecondary },
  acceptBtn: {
    flex: 2, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: colors.accent, alignItems: 'center', ...shadows.sm,
  },
  acceptText: { ...typography.buttonSmall, color: '#fff' },

  statusBadge: {
    marginTop: 14, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radius.md, alignSelf: 'flex-start',
  },
  statusText: { fontWeight: '700', fontSize: 13 },
});
