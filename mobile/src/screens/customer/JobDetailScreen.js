import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { getJobById } from '../../api/jobs.api';
import { confirmCompletion } from '../../api/payments.api';
import { colors, radius, shadows, typography, statusConfig } from '../../theme';

const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5000' : 'http://192.168.0.127:5000';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => { loadJob(); }, [jobId]);

  const loadJob = async () => {
    try { const { data } = await getJobById(jobId); setJob(data.job); }
    catch { Alert.alert('Error', 'Failed to load job'); }
  };

  const doConfirmCompletion = async () => {
    try { await confirmCompletion(jobId); Alert.alert('Done!', 'Payment released successfully'); loadJob(); }
    catch (err) { Alert.alert('Error', err.response?.data?.error || 'Failed'); }
  };

  const handleConfirmCompletion = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('This will mark the job as complete and release payment to the provider. Are you sure?')) {
        doConfirmCompletion();
      }
    } else {
      Alert.alert('Confirm Completion', 'This will release payment to the provider. Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, release payment', onPress: doConfirmCompletion },
      ]);
    }
  };

  if (!job) return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{'Loading job details...'}</Text>
    </View>
  );

  const status = statusConfig[job.status] || statusConfig.open;
  const photos = typeof job.photos === 'string' ? JSON.parse(job.photos) : job.photos || [];
  const isOwner = user?.id === job.customer_id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={[styles.statusBanner, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusIcon, { color: status.color }]}>{status.icon}</Text>
        <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
      </View>

      <View style={styles.titleSection}>
        {job.category_name ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category_name}</Text>
          </View>
        ) : null}
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.postedBy}>
          {`Posted by ${job.customer_name} \u00B7 ${new Date(job.created_at).toLocaleDateString()}`}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.detailCards}>
        {job.budget ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>{'Budget'}</Text>
            <Text style={[styles.detailCardValue, { color: colors.accent }]}>{`$${parseFloat(job.budget).toLocaleString()}`}</Text>
          </View>
        ) : null}
        {job.bid_count !== undefined ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>{'Bids'}</Text>
            <Text style={[styles.detailCardValue, { color: colors.primary }]}>{String(job.bid_count)}</Text>
          </View>
        ) : null}
        {job.deadline ? (
          <View style={styles.detailCard}>
            <Text style={styles.detailCardLabel}>{'Deadline'}</Text>
            <Text style={styles.detailCardValue}>{new Date(job.deadline).toLocaleDateString()}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{'Description'}</Text>
        <Text style={styles.description}>{job.description}</Text>
      </View>

      {job.location_address ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{'Location'}</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationPin}>{'\u25CB'}</Text>
            <Text style={styles.locationText}>{job.location_address}</Text>
          </View>
        </View>
      ) : null}

      {job.provider_name ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{'Assigned Provider'}</Text>
          <View style={styles.providerCard}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerInitial}>{job.provider_name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.providerName}>{job.provider_name}</Text>
          </View>
        </View>
      ) : null}

      {photos.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{'Photos'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri: `${BASE_URL}${uri}` }} style={styles.photo} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.actions}>
        {isOwner && job.status === 'open' ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Bids', { jobId: job.id })} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>{`View Bids (${job.bid_count})`}</Text>
          </TouchableOpacity>
        ) : null}

        {isOwner && ['assigned', 'in_progress'].includes(job.status) ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Chat', { jobId: job.id })} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>{'Message Provider'}</Text>
          </TouchableOpacity>
        ) : null}

        {isOwner && ['assigned', 'in_progress'].includes(job.status) ? (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={handleConfirmCompletion} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>{'Confirm Complete & Pay'}</Text>
          </TouchableOpacity>
        ) : null}

        {isOwner && job.status === 'completed' && job.provider_id ? (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            onPress={() => navigation.navigate('Review', { jobId: job.id, revieweeId: job.provider_id, revieweeName: job.provider_name || 'Provider' })}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryBtnText, { color: colors.text }]}>{'Leave a Review'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { ...typography.bodySmall },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  statusIcon: { fontSize: 12, fontWeight: '700' },
  statusLabel: { fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },

  titleSection: { padding: 20 },
  categoryBadge: { backgroundColor: colors.primaryBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, alignSelf: 'flex-start', marginBottom: 10 },
  categoryText: { ...typography.caption, color: colors.primary, fontSize: 11 },
  title: { ...typography.h1, fontSize: 24, marginBottom: 8 },
  postedBy: { ...typography.bodySmall, fontSize: 13 },

  detailCards: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  detailCard: {
    backgroundColor: colors.white, paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: radius.lg, minWidth: 110, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  detailCardLabel: { ...typography.caption, marginBottom: 6 },
  detailCardValue: { fontSize: 22, fontWeight: '800', color: colors.text },

  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { ...typography.caption, marginBottom: 10 },
  description: { ...typography.body, lineHeight: 24, color: colors.text },

  locationCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  locationPin: { fontSize: 18, color: colors.primary },
  locationText: { ...typography.body, flex: 1 },

  providerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  providerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  providerInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  providerName: { ...typography.h3 },

  photo: { width: 180, height: 140, borderRadius: radius.lg, marginRight: 10 },

  actions: { padding: 20, gap: 12 },
  primaryBtn: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', ...shadows.md,
  },
  primaryBtnText: { ...typography.button, color: '#fff' },
  secondaryBtn: {
    paddingVertical: 18, borderRadius: radius.lg, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.primary,
  },
  secondaryBtnText: { ...typography.button, color: colors.primary },
});
