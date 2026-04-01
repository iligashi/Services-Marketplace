import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { getJobById } from '../../api/jobs.api';
import { confirmCompletion } from '../../api/payments.api';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const { data } = await getJobById(jobId);
      setJob(data.job);
    } catch (err) {
      Alert.alert('Error', 'Failed to load job');
    }
  };

  const handleConfirmCompletion = async () => {
    Alert.alert('Confirm', 'Confirm job is complete and release payment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          try {
            await confirmCompletion(jobId);
            Alert.alert('Success', 'Payment released!');
            loadJob();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed');
          }
        },
      },
    ]);
  };

  if (!job) return <View style={styles.container}><Text>Loading...</Text></View>;

  const photos = typeof job.photos === 'string' ? JSON.parse(job.photos) : job.photos || [];
  const isOwner = user?.id === job.customer_id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={[styles.statusBadge, statusColors[job.status]]}>
          <Text style={styles.statusText}>{job.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {job.category_name && <Text style={styles.category}>{job.category_name}</Text>}

      <Text style={styles.description}>{job.description}</Text>

      <View style={styles.detailsRow}>
        {job.budget && <DetailItem label="Budget" value={`$${job.budget}`} />}
        {job.deadline && <DetailItem label="Deadline" value={new Date(job.deadline).toLocaleDateString()} />}
        {job.bid_count !== undefined && <DetailItem label="Bids" value={job.bid_count.toString()} />}
      </View>

      {job.location_address && (
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Location: </Text>
          <Text style={styles.locationValue}>{job.location_address}</Text>
        </View>
      )}

      {photos.length > 0 && (
        <ScrollView horizontal style={styles.photoScroll}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri: `http://localhost:3000${uri}` }} style={styles.photo} />
          ))}
        </ScrollView>
      )}

      <View style={styles.actions}>
        {isOwner && job.status === 'open' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Bids', { jobId: job.id })}>
            <Text style={styles.actionBtnText}>View Bids ({job.bid_count})</Text>
          </TouchableOpacity>
        )}

        {isOwner && job.status === 'in_progress' && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Chat', { jobId: job.id })}>
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00b894' }]} onPress={handleConfirmCompletion}>
              <Text style={styles.actionBtnText}>Confirm & Pay</Text>
            </TouchableOpacity>
          </>
        )}

        {isOwner && job.status === 'completed' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#fdcb6e' }]}
            onPress={() => navigation.navigate('Review', { jobId: job.id, revieweeId: job.provider_id, revieweeName: 'Provider' })}>
            <Text style={[styles.actionBtnText, { color: '#2d3436' }]}>Leave Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function DetailItem({ label, value }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const statusColors = {
  open: { backgroundColor: '#dfe6e9' },
  assigned: { backgroundColor: '#74b9ff' },
  in_progress: { backgroundColor: '#ffeaa7' },
  completed: { backgroundColor: '#55efc4' },
  disputed: { backgroundColor: '#fab1a0' },
  cancelled: { backgroundColor: '#ff7675' },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', color: '#2d3436' },
  category: { paddingHorizontal: 16, fontSize: 14, color: '#0984e3', fontWeight: '500' },
  description: { padding: 16, fontSize: 15, lineHeight: 22, color: '#2d3436' },
  detailsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 16 },
  detailItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, minWidth: 90, alignItems: 'center', borderWidth: 1, borderColor: '#dfe6e9' },
  detailLabel: { fontSize: 12, color: '#636e72', marginBottom: 4 },
  detailValue: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
  locationRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  locationLabel: { fontSize: 14, color: '#636e72' },
  locationValue: { fontSize: 14, color: '#2d3436', flex: 1 },
  photoScroll: { paddingHorizontal: 16, marginTop: 12 },
  photo: { width: 150, height: 150, borderRadius: 10, marginRight: 8 },
  actions: { padding: 16, gap: 10 },
  actionBtn: { backgroundColor: '#0984e3', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
