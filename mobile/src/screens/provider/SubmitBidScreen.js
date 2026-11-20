import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet } from 'react-native';
import { submitBid } from '../../api/jobs.api';
import { Screen, Card, Field, Button, IconTile, Pill, Tappable } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { categoryMeta, money } from '../../utils/categories';
import { successFeedback } from '../../utils/haptics';

const PLATFORM_FEE = 0.12;

function Line({ label, value, color, bold }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={[type.subhead, { color: bold ? colors.text : colors.textSecondary, fontWeight: bold ? '600' : '400' }]}>{label}</Text>
      <Text style={[bold ? type.title3 : type.subhead, { color: color || colors.text, fontWeight: bold ? '700' : '500' }]}>{value}</Text>
    </View>
  );
}

export default function SubmitBidScreen({ route, navigation }) {
  const { job } = route.params;
  const { colors } = useTheme();
  const [amount, setAmount] = useState(job.budget?.toString() || '');
  const [message, setMessage] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }
    setSubmitting(true);
    try {
      await submitBid({
        job_id: job.id,
        amount: parseFloat(amount),
        message: message || undefined,
        estimated_hours: estimatedHours ? parseInt(estimatedHours, 10) : undefined,
      });
      successFeedback();
      Alert.alert('Bid Submitted!', 'The customer will review your bid.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit bid');
    } finally { setSubmitting(false); }
  };

  const cat = categoryMeta(job.category_slug || job.category_name);
  const value = parseFloat(amount) || 0;
  const budget = parseFloat(job.budget) || 0;
  const quick = budget
    ? [
      { label: 'Match budget', v: budget },
      { label: '−5%', v: Math.round(budget * 0.95) },
      { label: '−10%', v: Math.round(budget * 0.9) },
    ]
    : [];

  return (
    <Screen
      title="Your Offer"
      large={false}
      footer={<Button title={submitting ? 'Sending…' : 'Submit Bid'} icon="paper-plane" loading={submitting} disabled={value <= 0} onPress={handleSubmit} />}
    >
      {/* Job summary */}
      <Card style={{ marginHorizontal: 16, marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <IconTile icon={cat.icon} tone={cat.tone} size={32} />
          <Text style={[type.footnote, { color: colors.textSecondary, flex: 1 }]}>{job.category_name || 'General'}</Text>
          {job.location_address ? <Pill label={job.location_address} icon="location" tone="textSecondary" size="sm" /> : null}
        </View>
        <Text style={[type.title3, { color: colors.text }]}>{job.title}</Text>
        <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={3}>{job.description}</Text>
        {budget ? (
          <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 10 }]}>
            Customer budget <Text style={{ color: colors.text, fontWeight: '700' }}>{money(budget)}</Text>
          </Text>
        ) : null}
      </Card>

      {/* Amount */}
      <View style={{ alignItems: 'center', marginTop: 30 }}>
        <Text style={[type.footnote, { color: colors.textSecondary, fontWeight: '600' }]}>YOUR PRICE</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ fontSize: 40, fontWeight: '600', color: colors.textTertiary }}>$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel="Bid amount"
            style={{ fontSize: 56, fontWeight: '700', color: colors.text, minWidth: 80, textAlign: 'center', outlineStyle: 'none', letterSpacing: -1 }}
          />
        </View>
        {quick.length ? (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {quick.map((q) => {
              const active = value === q.v;
              return (
                <Tappable
                  key={q.label}
                  onPress={() => setAmount(String(q.v))}
                  style={{ paddingHorizontal: 14, height: 32, borderRadius: 16, justifyContent: 'center', backgroundColor: active ? colors.primary : colors.fill }}
                >
                  <Text style={[type.footnote, { fontWeight: '600', color: active ? '#fff' : colors.text }]}>{q.label}</Text>
                </Tappable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 28, gap: 12 }}>
        <Field icon="time" placeholder="Estimated hours, e.g. 3" value={estimatedHours} onChangeText={setEstimatedHours} keyboardType="numeric" suffix="hours" />
        <Field
          placeholder="Introduce yourself, explain your approach and mention similar jobs you've done…"
          value={message}
          onChangeText={setMessage}
          multiline
        />
      </View>

      {value > 0 ? (
        <Card style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Text style={[type.footnote, { color: colors.textSecondary, fontWeight: '600', marginBottom: 4 }]}>ESTIMATED PAYOUT</Text>
          <Line label="Your price" value={money(value, { decimals: 2 })} />
          <Line label="Platform fee (12%)" value={`−${money(value * PLATFORM_FEE, { decimals: 2 })}`} color={colors.error} />
          <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginVertical: 6 }} />
          <Line label="You receive" value={money(value * (1 - PLATFORM_FEE), { decimals: 2 })} color={colors.success} bold />
        </Card>
      ) : null}
    </Screen>
  );
}
