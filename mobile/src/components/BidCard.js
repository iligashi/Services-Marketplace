import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from './StarRating';
import Avatar from './Avatar';
import { colors, radius, shadows, typography } from '../theme';

export default function BidCard({ bid, onAccept, onReject, onViewProfile }) {
  const isPending = bid.status === 'pending';
  const isAccepted = bid.status === 'accepted';

  return (
    <View style={styles.card}>
      {/* Provider header — tappable to open full profile */}
      <TouchableOpacity style={styles.providerRow} onPress={onViewProfile} activeOpacity={onViewProfile ? 0.6 : 1} disabled={!onViewProfile}>
        <Avatar name={bid.provider_name} uri={bid.provider_avatar} size={50} style={{ marginRight: 12 }} />
        <View style={styles.providerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName}>{bid.provider_name}</Text>
            {bid.badge ? (
              <View style={[styles.verifiedBadge, bid.badge.tier === 'elite_pro' && styles.eliteBadge]}>
                <Ionicons
                  name={bid.badge.tier === 'elite_pro' ? 'trophy' : bid.badge.tier === 'top_rated' ? 'star' : 'shield-checkmark'}
                  size={12}
                  color={bid.badge.tier === 'elite_pro' ? colors.accentDark : colors.success}
                />
                <Text style={[styles.verifiedText, bid.badge.tier === 'elite_pro' && { color: colors.accentDark }]}>{bid.badge.label}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.statsRow}>
            <StarRating rating={bid.avg_rating || 0} size={12} showValue />
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statText}>{bid.total_jobs_done || 0} jobs</Text>
            {bid.years_experience > 0 ? (
              <>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.statText}>{bid.years_experience}yr exp</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amountLabel}>Bid</Text>
          <Text style={styles.amount}>${parseFloat(bid.amount).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>

      {onViewProfile ? (
        <TouchableOpacity style={styles.viewProfileRow} onPress={onViewProfile} activeOpacity={0.6}>
          <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
          <Text style={styles.viewProfileText}>View full profile</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {bid.estimated_hours ? (
        <View style={styles.estimateRow}>
          <Ionicons name="time-outline" size={14} color={colors.primary} />
          <Text style={styles.estimateText}>Est. {bid.estimated_hours} hours</Text>
        </View>
      ) : null}

      {bid.message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{bid.message}</Text>
        </View>
      ) : null}

      {/* Actions */}
      {isPending ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineBtn} onPress={onReject} activeOpacity={0.7}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
            <Text style={styles.acceptText}>Accept Bid</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.statusBadge, isAccepted ? styles.statusAccepted : styles.statusDeclined]}>
          <Ionicons name={isAccepted ? 'checkmark-circle' : 'close-circle'} size={14} color={isAccepted ? colors.success : colors.textTertiary} />
          <Text style={[styles.statusText, { color: isAccepted ? colors.success : colors.textTertiary }]}>
            {isAccepted ? 'Accepted' : 'Declined'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white, marginHorizontal: 16, marginVertical: 6,
    padding: 18, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },

  providerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  providerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  providerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.successBg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  eliteBadge: { backgroundColor: colors.accentLight },
  verifiedText: { fontSize: 10, fontWeight: '700', color: colors.success },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { color: colors.textTertiary, fontSize: 12 },
  statText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  amountWrap: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.success },

  viewProfileRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  viewProfileText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.primary },

  estimateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  estimateText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  messageBox: {
    backgroundColor: colors.bg, padding: 14, borderRadius: radius.lg,
    marginTop: 12, borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, gap: 6,
  },
  declineText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: radius.lg,
    backgroundColor: colors.success, gap: 6, ...shadows.sm,
  },
  acceptText: { fontSize: 14, fontWeight: '700', color: colors.white },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: radius.lg, alignSelf: 'flex-start',
  },
  statusAccepted: { backgroundColor: colors.successBg },
  statusDeclined: { backgroundColor: colors.bgAlt },
  statusText: { fontSize: 13, fontWeight: '700' },
});
