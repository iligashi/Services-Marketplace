import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../store/jobSlice';
import api from '../../api/axios.instance';
import { colors, radius, shadows, typography } from '../../theme';

export default function PostJobScreen() {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.jobs);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
  }, []);

  const handleSubmit = async () => {
    if (!title || title.length < 5) {
      Alert.alert('Error', 'Title must be at least 5 characters');
      return;
    }
    if (!description || description.length < 10) {
      Alert.alert('Error', 'Description must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const body = { title, description };
      if (budget) body.budget = parseFloat(budget);
      if (categoryId) body.category_id = categoryId;
      if (address) body.location_address = address;

      await api.post('/jobs', body);
      Alert.alert('Success!', 'Your job has been posted. Providers will start bidding soon!');
      setTitle(''); setDescription(''); setBudget(''); setCategoryId(null); setAddress('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = categories.find(c => c.id === categoryId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{'Post a new job'}</Text>
      <Text style={styles.pageSubtitle}>{'Describe what you need done and get bids from local pros'}</Text>

      <Text style={styles.label}>{'CATEGORY'}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, categoryId === cat.id && styles.catChipActive]}
            onPress={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.catChipText, categoryId === cat.id && styles.catChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>{'JOB TITLE'}</Text>
      <TextInput
        style={[styles.input, focused === 'title' && styles.inputFocused]}
        placeholder="e.g. Fix leaking kitchen faucet"
        placeholderTextColor={colors.textTertiary}
        value={title}
        onChangeText={setTitle}
        onFocus={() => setFocused('title')}
        onBlur={() => setFocused(null)}
      />

      <Text style={styles.label}>{'DESCRIPTION'}</Text>
      <TextInput
        style={[styles.input, styles.textArea, focused === 'desc' && styles.inputFocused]}
        placeholder="Describe the job in detail"
        placeholderTextColor={colors.textTertiary}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
        onFocus={() => setFocused('desc')}
        onBlur={() => setFocused(null)}
      />
      <Text style={styles.charCount}>{`${description.length}/5000`}</Text>

      <Text style={styles.label}>{'BUDGET (OPTIONAL)'}</Text>
      <View style={[styles.budgetRow, focused === 'budget' && styles.inputFocused]}>
        <Text style={styles.currency}>{'$'}</Text>
        <TextInput
          style={styles.budgetInput}
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          onFocus={() => setFocused('budget')}
          onBlur={() => setFocused(null)}
        />
        <Text style={styles.budgetHint}>{'USD'}</Text>
      </View>

      <Text style={styles.label}>{'LOCATION'}</Text>
      <TextInput
        style={[styles.input, focused === 'addr' && styles.inputFocused]}
        placeholder="Address or neighborhood"
        placeholderTextColor={colors.textTertiary}
        value={address}
        onChangeText={setAddress}
        onFocus={() => setFocused('addr')}
        onBlur={() => setFocused(null)}
      />

      {title.length >= 5 ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{'Job Summary'}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{'Title'}</Text>
            <Text style={styles.summaryValue}>{title}</Text>
          </View>
          {selectedCat ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{'Category'}</Text>
              <Text style={styles.summaryValue}>{selectedCat.name}</Text>
            </View>
          ) : null}
          {budget ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{'Budget'}</Text>
              <Text style={[styles.summaryValue, { color: colors.accent, fontWeight: '700' }]}>{`$${budget}`}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>{submitting ? 'Posting...' : 'Post Job'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  pageTitle: { ...typography.h1, marginBottom: 4 },
  pageSubtitle: { ...typography.bodySmall, marginBottom: 28 },

  label: { ...typography.caption, marginBottom: 8, marginTop: 20 },

  input: {
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    fontSize: 16, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  textArea: { minHeight: 120, paddingTop: 16 },
  charCount: { ...typography.bodySmall, fontSize: 11, textAlign: 'right', marginTop: 4 },

  budgetRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16,
  },
  currency: { fontSize: 22, fontWeight: '700', color: colors.accent, marginRight: 8 },
  budgetInput: { flex: 1, paddingVertical: 16, fontSize: 22, fontWeight: '600', color: colors.text },
  budgetHint: { ...typography.bodySmall, fontSize: 12 },

  catScroll: { marginBottom: 4 },
  catChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full,
    marginRight: 8, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { ...typography.buttonSmall, fontSize: 13, color: colors.textSecondary },
  catChipTextActive: { color: '#fff' },

  summaryCard: {
    backgroundColor: colors.primaryBg, padding: 18, borderRadius: radius.lg,
    marginTop: 24, borderWidth: 1, borderColor: '#C7D2FE',
  },
  summaryTitle: { ...typography.caption, color: colors.primary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { ...typography.bodySmall, fontSize: 13 },
  summaryValue: { ...typography.bodySmall, fontSize: 13, color: colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  submitBtn: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 28,
    ...shadows.md,
  },
  submitText: { ...typography.button, color: '#fff' },
});
