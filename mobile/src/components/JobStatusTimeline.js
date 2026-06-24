import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme';

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function JobStatusTimeline({ job }) {
  const { colors } = useTheme();

  if (job.status === 'cancelled') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgAlt, padding: 16, borderRadius: radius.lg }}>
        <Ionicons name="close-circle" size={22} color={colors.textTertiary} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>This job was cancelled</Text>
      </View>
    );
  }

  if (job.status === 'disputed') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.errorBg, padding: 16, borderRadius: radius.lg }}>
        <Ionicons name="alert-circle" size={22} color={colors.error} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.error }}>Dispute in progress</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Our team is reviewing this job</Text>
        </View>
      </View>
    );
  }

  const order = ['open', 'assigned', 'in_progress', 'completed'];
  const currentIndex = order.indexOf(job.status);

  const steps = [
    { key: 'open', label: 'Job posted', date: fmt(job.created_at) },
    { key: 'assigned', label: 'Provider assigned', date: null },
    { key: 'in_progress', label: 'Work in progress', date: null },
    { key: 'completed', label: 'Completed & paid', date: fmt(job.status === 'completed' ? job.updated_at : null) },
  ];

  return (
    <View>
      {steps.map((step, i) => {
        const isDone = i < currentIndex || job.status === 'completed';
        const isCurrent = i === currentIndex && job.status !== 'completed';
        const isLast = i === steps.length - 1;

        return (
          <View key={step.key} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: isDone ? colors.success : isCurrent ? colors.primary : colors.bgAlt,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: isCurrent ? 0 : 1, borderColor: colors.border,
              }}>
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : isCurrent ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
                ) : null}
              </View>
              {!isLast && (
                <View style={{ width: 2, flex: 1, minHeight: 28, backgroundColor: isDone ? colors.success : colors.border, marginVertical: 2 }} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18, paddingLeft: 12 }}>
              <Text style={{
                fontSize: 14, fontWeight: isCurrent ? '700' : '600',
                color: isDone || isCurrent ? colors.text : colors.textTertiary,
              }}>
                {step.label}
              </Text>
              {step.date ? (
                <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 2 }}>{step.date}</Text>
              ) : null}

              {/* Dual-confirmation sub-status — shown on whichever step (assigned or
                  in_progress) is currently active, since jobs without a configured
                  payment flow can stay "assigned" while both sides confirm */}
              {(step.key === 'assigned' || step.key === 'in_progress') && isCurrent ? (
                <View style={{ marginTop: 8, gap: 6 }}>
                  <ConfirmRow label="Customer" confirmed={!!job.customer_confirmed_at} colors={colors} />
                  <ConfirmRow label="Provider" confirmed={!!job.provider_confirmed_at} colors={colors} />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ConfirmRow({ label, confirmed, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons
        name={confirmed ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={confirmed ? colors.success : colors.textTertiary}
      />
      <Text style={{ fontSize: 12, color: confirmed ? colors.success : colors.textTertiary, fontWeight: '500' }}>
        {label} {confirmed ? 'confirmed completion' : 'has not confirmed yet'}
      </Text>
    </View>
  );
}
