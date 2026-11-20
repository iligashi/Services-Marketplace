import React, { useRef, useState } from 'react';
import { View, Text, Alert, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios.instance';
import Avatar from '../../components/Avatar';
import { Screen, Field, Button, Pill } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { impactFeedback, successFeedback } from '../../utils/haptics';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function Star({ index, rating, onPress }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const filled = rating >= index;

  const press = () => {
    impactFeedback();
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 18 }).start();
    onPress(index);
  };

  return (
    <Pressable onPress={press} hitSlop={6} accessibilityLabel={`${index} star${index > 1 ? 's' : ''}`}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={filled ? 'star' : 'star-outline'} size={44} color={filled ? colors.gold : colors.textTertiary} />
      </Animated.View>
    </Pressable>
  );
}

export default function ReviewScreen({ route, navigation }) {
  const { jobId, revieweeId, revieweeName } = route.params;
  const { colors } = useTheme();
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
      await api.post('/reviews', { job_id: jobId, reviewee_id: revieweeId, rating, comment: comment || undefined });
      successFeedback();
      Alert.alert('Success', 'Review submitted!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      title="Review"
      large={false}
      titleOnScroll
      footer={<Button title="Submit Review" icon="star" loading={submitting} disabled={rating === 0} onPress={handleSubmit} />}
    >
      <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 }}>
        <Avatar name={revieweeName} size={84} />
        <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 16 }]}>How was your experience with</Text>
        <Text style={[type.title1, { color: colors.text, marginTop: 2, textAlign: 'center' }]}>{revieweeName}?</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 24 }}>
          {[1, 2, 3, 4, 5].map((i) => <Star key={i} index={i} rating={rating} onPress={setRating} />)}
        </View>
        <View style={{ height: 34, justifyContent: 'center', marginTop: 8 }}>
          {rating > 0 ? <Pill label={STAR_LABELS[rating]} tone="gold" /> : <Text style={[type.footnote, { color: colors.textTertiary }]}>Tap a star to rate</Text>}
        </View>
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 20 }}>
        <Field
          label="Your review"
          placeholder="What went well? Anything that could be better?"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={500}
          hint={`${comment.length}/500 · Visible to other users`}
        />
      </View>
    </Screen>
  );
}
