import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import api from '../../api/axios.instance';
import { colors, radius, shadows, typography } from '../../theme';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export default function ReviewScreen({ route, navigation }) {
  const { jobId, revieweeId, revieweeName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        job_id: jobId,
        reviewee_id: revieweeId,
        rating,
        comment: comment || undefined,
      });
      Alert.alert('Success', 'Review submitted!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Reviewee Card */}
      <View style={styles.revieweeCard}>
        <View style={styles.revieweeAvatar}>
          <Text style={styles.revieweeAvatarText}>{revieweeName?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <Text style={styles.revieweeLabel}>How was your experience with</Text>
        <Text style={styles.revieweeName}>{revieweeName}?</Text>
      </View>

      {/* Star Rating */}
      <View style={styles.ratingSection}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              activeOpacity={0.7}
              style={styles.starBtn}
            >
              <Text style={[styles.star, rating >= star && styles.starActive]}>
                {rating >= star ? '\u2605' : '\u2606'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <View style={styles.ratingLabelBadge}>
            <Text style={styles.ratingLabelText}>{STAR_LABELS[rating]}</Text>
          </View>
        )}
      </View>

      {/* Comment */}
      <Text style={styles.label}>YOUR REVIEW</Text>
      <TextInput
        style={[styles.commentInput, focused && styles.inputFocused]}
        placeholder="Share details about your experience — what went well, anything that could improve..."
        placeholderTextColor={colors.textTertiary}
        value={comment}
        onChangeText={setComment}
        multiline
        textAlignVertical="top"
        maxLength={500}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <Text style={styles.charCount}>{comment.length}/500</Text>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting || rating === 0}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Your review will be visible to other users and helps build trust in the community.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  revieweeCard: {
    alignItems: 'center', backgroundColor: colors.white, padding: 28,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    marginBottom: 28, ...shadows.md,
  },
  revieweeAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...shadows.md,
  },
  revieweeAvatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  revieweeLabel: { ...typography.bodySmall, marginBottom: 4 },
  revieweeName: { ...typography.h2 },

  ratingSection: { alignItems: 'center', marginBottom: 28 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 44, color: colors.border },
  starActive: { color: colors.gold },
  ratingLabelBadge: {
    marginTop: 12, backgroundColor: colors.goldBg,
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full,
  },
  ratingLabelText: { ...typography.buttonSmall, color: colors.gold, fontSize: 13 },

  label: { ...typography.caption, marginBottom: 8 },

  commentInput: {
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    fontSize: 15, color: colors.text, lineHeight: 22,
    borderWidth: 1.5, borderColor: colors.border,
    minHeight: 120, paddingTop: 16,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  charCount: { ...typography.bodySmall, fontSize: 11, textAlign: 'right', marginTop: 6 },

  submitBtn: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 24, ...shadows.md,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { ...typography.button, color: '#fff' },

  disclaimer: {
    ...typography.bodySmall, fontSize: 12, textAlign: 'center',
    marginTop: 16, lineHeight: 18,
  },
});
