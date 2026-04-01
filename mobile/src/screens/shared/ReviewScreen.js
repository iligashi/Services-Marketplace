import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../../api/axios.instance';

export default function ReviewScreen({ route, navigation }) {
  const { jobId, revieweeId, revieweeName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <View style={styles.container}>
      <Text style={styles.title}>Rate {revieweeName}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, rating >= star && styles.starActive]}>
              {rating >= star ? '\u2605' : '\u2606'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.commentInput}
        placeholder="Write a comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8f9fa' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  stars: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  star: { fontSize: 40, color: '#dfe6e9', marginHorizontal: 4 },
  starActive: { color: '#fdcb6e' },
  commentInput: { backgroundColor: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9', textAlignVertical: 'top', minHeight: 100 },
  submitBtn: { backgroundColor: '#0984e3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
