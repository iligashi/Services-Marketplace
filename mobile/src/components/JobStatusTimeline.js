import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { type } from '../theme';
import { IconTile } from './ui';

function fmt(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function JobStatusTimeline({ job }) {
  const { colors } = useTheme();

  if (job.status === 'cancelled' || job.status === 'disputed') {
    const cancelled = job.status === 'cancelled';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconTile icon={cancelled ? 'close' : 'alert'} tone={cancelled ? 'textSecondary' : 'error'} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={[type.headline, { color: cancelled ? colors.text : colors.error }]}>
            {cancelled ? 'This job was cancelled' : 'Dispute in progress'}
          </Text>
          {!cancelled ? (
            <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 2 }]}>Our team is reviewing this job. Payment is on hold.</Text>
          ) : null}
        </View>
      </View>
    );
  }

  const order = ['open', 'assigned', 'in_progress', 'completed'];
  const currentIndex = order.indexOf(job.status);

  const steps = [
    { key: 'open', label: 'Job posted', icon: 'megaphone', date: fmt(job.created_at) },
    { key: 'assigned', label: 'Pro assigned', icon: 'person', date: null },
    { key: 'in_progress', label: 'Work in progress', icon: 'hammer', date: null },
    { key: 'completed', label: 'Completed & paid', icon: 'checkmark', date: fmt(job.status === 'completed' ? job.updated_at : null) },
  ];

  return (
    <View>
      {steps.map((step, i) => {
        const isDone = i < currentIndex || job.status === 'completed';
        const isCurrent = i === currentIndex && job.status !== 'completed';
        const isLast = i === steps.length - 1;
        const dotColor = isDone ? colors.success : isCurrent ? colors.primary : colors.fillStrong;

        return (
          <View key={step.key} style={{ flexDirection: 'row' }}>
            <View style={{ alignItems: 'center', width: 32 }}>
              <View style={{
                width: 30, height: 30, borderRadius: 15, backgroundColor: dotColor,
                justifyContent: 'center', alignItems: 'center',
                ...(isCurrent ? { shadowColor: colors.primary, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } } : null),
              }}>
                <Ionicons name={isDone ? 'checkmark' : step.icon} size={15} color={isDone || isCurrent ? '#fff' : colors.textTertiary} />
              </View>
              {!isLast ? (
                <View style={{ width: 2, flex: 1, minHeight: 22, borderRadius: 1, backgroundColor: isDone ? colors.success : colors.fill, marginVertical: 3 }} />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16, paddingLeft: 12, paddingTop: 4 }}>
              <Text style={[type.subhead, {
                fontWeight: isCurrent ? '700' : '500',
                color: isDone || isCurrent ? colors.text : colors.textTertiary,
              }]}>
                {step.label}
              </Text>
              {step.date ? <Text style={[type.caption, { color: colors.textSecondary, marginTop: 1 }]}>{step.date}</Text> : null}

              {/* Both sides confirm completion while the job is assigned or in progress */}
              {(step.key === 'assigned' || step.key === 'in_progress') && isCurrent ? (
                <View style={{ marginTop: 8, gap: 5 }}>
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
      <Ionicons name={confirmed ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={confirmed ? colors.success : colors.textTertiary} />
      <Text style={[type.caption, { color: confirmed ? colors.success : colors.textSecondary }]}>
        {label} {confirmed ? 'confirmed completion' : 'has not confirmed yet'}
      </Text>
    </View>
  );
}
