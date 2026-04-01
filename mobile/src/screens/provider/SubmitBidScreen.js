import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { submitBid } from '../../api/jobs.api';

export default function SubmitBidScreen({ route, navigation }) {
  const { job } = route.params;
  const [amount, setAmount] = useState(job.budget?.toString() || '');
  const [message, setMessage] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount) {
      Alert.alert('Error', 'Please enter your bid amount');
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
      Alert.alert('Success', 'Bid submitted!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.jobSummary}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        {job.budget && <Text style={styles.jobBudget}>Customer budget: ${job.budget}</Text>}
        {job.location_address && <Text style={styles.jobLocation}>{job.location_address}</Text>}
      </View>

      <Text style={styles.label}>Your Bid Amount ($)</Text>
      <TextInput style={styles.input} placeholder="Enter amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />

      <Text style={styles.label}>Estimated Hours</Text>
      <TextInput style={styles.input} placeholder="e.g. 3" value={estimatedHours} onChangeText={setEstimatedHours} keyboardType="numeric" />

      <Text style={styles.label}>Message to Customer</Text>
      <TextInput style={[styles.input, { height: 100 }]} placeholder="Introduce yourself and explain your approach..." value={message} onChangeText={setMessage} multiline textAlignVertical="top" />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Bid'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f8f9fa' },
  jobSummary: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#dfe6e9' },
  jobTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  jobBudget: { fontSize: 15, color: '#00b894', fontWeight: '500' },
  jobLocation: { fontSize: 14, color: '#636e72', marginTop: 4 },
  label: { fontSize: 15, fontWeight: '600', color: '#2d3436', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9' },
  submitBtn: { backgroundColor: '#00b894', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
