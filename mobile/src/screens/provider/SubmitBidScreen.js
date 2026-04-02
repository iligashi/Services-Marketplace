import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { submitBid } from '../../api/jobs.api';
import { colors, radius, shadows, typography, statusConfig } from '../../theme';

export default function SubmitBidScreen({ route, navigation }) {
  const { job } = route.params;
  const [amount, setAmount] = useState(job.budget?.toString() || '');
  const [message, setMessage] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);

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
      Alert.alert('Bid Submitted!', 'The customer will review your bid.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit bid');
    } finally { setSubmitting(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Job Summary */}
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          {job.category_name ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{job.category_name}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobDesc} numberOfLines={3}>{job.description}</Text>
        <View style={styles.jobMeta}>
          {job.budget ? (
            <View style={styles.jobMetaItem}>
              <Text style={styles.jobMetaLabel}>{'Customer Budget'}</Text>
              <Text style={styles.jobMetaValue}>{`$${parseFloat(job.budget).toLocaleString()}`}</Text>
            </View>
          ) : null}
          {job.location_address ? (
            <View style={styles.jobMetaItem}>
              <Text style={styles.jobMetaLabel}>{'Location'}</Text>
              <Text style={styles.jobMetaValue}>{job.location_address}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Bid Form */}
      <Text style={styles.sectionTitle}>YOUR BID</Text>

      <Text style={styles.label}>BID AMOUNT</Text>
      <View style={[styles.amountRow, focused === 'amount' && styles.inputFocused]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          onFocus={() => setFocused('amount')}
          onBlur={() => setFocused(null)}
        />
      </View>

      <Text style={styles.label}>ESTIMATED HOURS</Text>
      <TextInput
        style={[styles.input, focused === 'hours' && styles.inputFocused]}
        placeholder="e.g. 3"
        placeholderTextColor={colors.textTertiary}
        value={estimatedHours}
        onChangeText={setEstimatedHours}
        keyboardType="numeric"
        onFocus={() => setFocused('hours')}
        onBlur={() => setFocused(null)}
      />

      <Text style={styles.label}>MESSAGE TO CUSTOMER</Text>
      <TextInput
        style={[styles.input, styles.textArea, focused === 'msg' && styles.inputFocused]}
        placeholder="Introduce yourself, describe your approach, mention relevant experience..."
        placeholderTextColor={colors.textTertiary}
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused('msg')}
        onBlur={() => setFocused(null)}
      />

      {amount && parseFloat(amount) > 0 ? (
        <View style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>ESTIMATED EARNINGS</Text>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Your bid</Text>
            <Text style={styles.earningsValue}>{`$${parseFloat(amount).toFixed(2)}`}</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>{'Platform fee (12%)'}</Text>
            <Text style={[styles.earningsValue, { color: colors.error }]}>{`-$${(parseFloat(amount) * 0.12).toFixed(2)}`}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsRow}>
            <Text style={[styles.earningsLabel, { fontWeight: '700', color: colors.text }]}>You'll receive</Text>
            <Text style={[styles.earningsValue, { color: colors.accent, fontSize: 20 }]}>
              {`$${(parseFloat(amount) * 0.88).toFixed(2)}`}
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Bid'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  jobCard: {
    backgroundColor: colors.white, padding: 18, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: 24, ...shadows.sm,
  },
  jobHeader: { flexDirection: 'row', marginBottom: 8 },
  categoryBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  categoryText: { ...typography.caption, color: colors.primary, fontSize: 10 },
  jobTitle: { ...typography.h3, marginBottom: 6 },
  jobDesc: { ...typography.bodySmall, lineHeight: 20, marginBottom: 12 },
  jobMeta: { flexDirection: 'row', gap: 16 },
  jobMetaItem: {},
  jobMetaLabel: { ...typography.caption, fontSize: 9, marginBottom: 2 },
  jobMetaValue: { ...typography.body, fontSize: 14, fontWeight: '600' },

  sectionTitle: { ...typography.h2, marginBottom: 16 },
  label: { ...typography.caption, marginBottom: 8, marginTop: 16 },

  input: {
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    fontSize: 16, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  textArea: { minHeight: 100, paddingTop: 16 },

  amountRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16,
  },
  currency: { fontSize: 24, fontWeight: '700', color: colors.accent, marginRight: 8 },
  amountInput: { flex: 1, paddingVertical: 16, fontSize: 28, fontWeight: '700', color: colors.text },

  earningsCard: {
    backgroundColor: colors.accentLight, padding: 18, borderRadius: radius.lg,
    marginTop: 24, borderWidth: 1, borderColor: '#A7F3D0',
  },
  earningsTitle: { ...typography.caption, color: colors.accentDark, marginBottom: 12 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  earningsLabel: { ...typography.bodySmall, fontSize: 14 },
  earningsValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  earningsDivider: { height: 1, backgroundColor: '#A7F3D0', marginVertical: 8 },

  submitBtn: {
    backgroundColor: colors.accent, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 28, ...shadows.md,
  },
  submitText: { ...typography.button, color: '#fff' },
});
