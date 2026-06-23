import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      Alert.alert('Too short', 'Job title must be at least 5 characters.');
      return;
    }
    if (!description || description.length < 10) {
      Alert.alert('Too short', 'Please describe the job in at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const body = { title, description };
      if (budget) body.budget = parseFloat(budget);
      if (categoryId) body.category_id = categoryId;
      if (address) body.location_address = address;
      await api.post('/jobs', body);
      Alert.alert('Posted!', 'Your job is live. Providers will start bidding soon.');
      setTitle(''); setDescription(''); setBudget(''); setCategoryId(null); setAddress('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post job.');
    } finally {
      setSubmitting(false);
    }
  };

  const fo = (field) => ({ onFocus: () => setFocused(field), onBlur: () => setFocused(null) });
  const selectedCat = categories.find(c => c.id === categoryId);
  const isReady = title.length >= 5 && description.length >= 10;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={styles.intro}>Describe your job clearly to attract the best bids.</Text>

        {/* Category */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Category</Text>
            <Text style={styles.optional}>optional</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipList}>
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategoryId(active ? null : cat.id)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Job Title</Text>
            <Text style={styles.required}>required</Text>
          </View>
          <TextInput
            style={[styles.input, focused === 'title' && styles.inputFocused]}
            placeholder="e.g. Fix leaking kitchen faucet"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            {...fo('title')}
          />
          <Text style={styles.hint}>{title.length}/100 characters</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.required}>required</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, focused === 'desc' && styles.inputFocused]}
            placeholder="Describe the work in detail — location, materials needed, urgency..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            {...fo('desc')}
          />
          <Text style={styles.hint}>{description.length} characters</Text>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Budget</Text>
            <Text style={styles.optional}>optional</Text>
          </View>
          <View style={[styles.budgetRow, focused === 'budget' && styles.inputFocused]}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              {...fo('budget')}
            />
            <Text style={styles.currencyCode}>USD</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.optional}>optional</Text>
          </View>
          <View style={[styles.inputRow, focused === 'addr' && styles.inputFocused]}>
            <Ionicons name="map-outline" size={16} color={focused === 'addr' ? colors.primary : colors.textTertiary} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent', marginBottom: 0 }]}
              placeholder="Address or neighborhood"
              placeholderTextColor={colors.textTertiary}
              value={address}
              onChangeText={setAddress}
              {...fo('addr')}
            />
          </View>
        </View>

        {/* Summary preview */}
        {isReady ? (
          <View style={styles.preview}>
            <View style={styles.previewHeader}>
              <Ionicons name="eye-outline" size={16} color={colors.primary} />
              <Text style={styles.previewTitle}>Preview</Text>
            </View>
            <Text style={styles.previewJobTitle}>{title}</Text>
            {selectedCat ? <Text style={styles.previewMeta}><Ionicons name="grid-outline" size={12} /> {selectedCat.name}</Text> : null}
            {budget ? <Text style={styles.previewBudget}>${budget} budget</Text> : null}
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (!isReady || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isReady || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <Text style={styles.submitText}>Posting...</Text>
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },

  intro: { ...typography.bodySmall, marginBottom: 24, lineHeight: 20 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  required: { fontSize: 11, fontWeight: '600', color: colors.error, backgroundColor: colors.errorBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  optional: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, backgroundColor: colors.bgAlt, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },

  input: {
    backgroundColor: colors.white, padding: 14, borderRadius: radius.lg,
    fontSize: 15, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  textArea: { minHeight: 120, paddingTop: 14, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: colors.textTertiary, marginTop: 6, textAlign: 'right' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14,
  },

  budgetRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16,
  },
  currencySymbol: { fontSize: 22, fontWeight: '800', color: colors.success, marginRight: 4 },
  budgetInput: { flex: 1, paddingVertical: 14, fontSize: 22, fontWeight: '700', color: colors.text },
  currencyCode: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },

  chipList: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full,
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  preview: {
    backgroundColor: colors.primaryBg, padding: 18,
    borderRadius: radius.xl, marginBottom: 24,
    borderWidth: 1.5, borderColor: colors.primaryBorder,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  previewTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewJobTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  previewMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  previewBudget: { fontSize: 15, fontWeight: '700', color: colors.success },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, paddingVertical: 17,
    borderRadius: radius.lg, ...shadows.md,
  },
  submitBtnDisabled: { backgroundColor: colors.bgAlt, ...shadows.xs },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
