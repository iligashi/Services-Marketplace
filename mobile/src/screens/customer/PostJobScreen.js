import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../store/jobSlice';
import { createJob } from '../../api/jobs.api';

export default function PostJobScreen({ navigation }) {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.jobs);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
  }, []);

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (budget) formData.append('budget', parseFloat(budget));
      if (categoryId) formData.append('category_id', categoryId);
      if (address) formData.append('location_address', address);

      await createJob(formData);
      Alert.alert('Success', 'Job posted successfully!');
      setTitle(''); setDescription(''); setBudget(''); setCategoryId(null); setAddress('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
            onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
          >
            <Text style={[styles.catChipText, categoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Fix leaking kitchen faucet" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 100 }]} placeholder="Describe the job in detail..." value={description} onChangeText={setDescription} multiline textAlignVertical="top" />

      <Text style={styles.label}>Budget ($)</Text>
      <TextInput style={styles.input} placeholder="e.g. 150" value={budget} onChangeText={setBudget} keyboardType="numeric" />

      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} placeholder="Address or area" value={address} onChangeText={setAddress} />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.submitText}>{submitting ? 'Posting...' : 'Post Job'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f8f9fa' },
  label: { fontSize: 15, fontWeight: '600', color: '#2d3436', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#dfe6e9' },
  catScroll: { marginBottom: 4 },
  catChip: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#dfe6e9' },
  catChipActive: { backgroundColor: '#0984e3', borderColor: '#0984e3' },
  catChipText: { fontSize: 14, color: '#2d3436' },
  submitBtn: { backgroundColor: '#0984e3', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
