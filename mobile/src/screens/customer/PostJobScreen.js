import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../store/jobSlice';
import api from '../../api/axios.instance';
import JobCard from '../../components/JobCard';
import { Screen, Field, Button, IconTile, Tappable, Appear, alpha } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';
import { categoryMeta } from '../../utils/categories';
import { successFeedback, tapFeedback } from '../../utils/haptics';

function Step({ number, title, done, children }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginLeft: 4 }}>
        <View style={{
          width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
          backgroundColor: done ? colors.success : colors.fillStrong,
        }}>
          {done
            ? <Ionicons name="checkmark" size={15} color="#fff" />
            : <Text style={[type.caption2, { color: colors.text }]}>{number}</Text>}
        </View>
        <Text style={[type.headline, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function PostJobScreen() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
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
      successFeedback();
      Alert.alert('Posted!', 'Your job is live. Providers will start bidding soon.');
      setTitle(''); setDescription(''); setBudget(''); setCategoryId(null); setAddress('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to post job.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === categoryId);
  const isReady = title.length >= 5 && description.length >= 10;

  return (
    <Screen title="New Job" subtitle="Tell pros what you need. Offers usually arrive within hours.">
      <Step number="1" title="Pick a category" done={!!categoryId}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {categories.map((cat) => {
            const active = categoryId === cat.id;
            const meta = categoryMeta(cat.slug || cat.name);
            const tint = colors[meta.tone] || colors.primary;
            return (
              <Tappable
                key={cat.id}
                onPress={() => { tapFeedback(); setCategoryId(active ? null : cat.id); }}
                haptic={false}
                scaleTo={0.95}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 14, height: 44, borderRadius: 22,
                  backgroundColor: active ? alpha(tint, 0.14) : colors.card,
                  borderWidth: 1.5, borderColor: active ? tint : 'transparent',
                }}
              >
                <IconTile icon={meta.icon} tone={meta.tone} size={30} style={{ borderRadius: 15 }} />
                <Text style={[type.subhead, { color: colors.text, fontWeight: active ? '600' : '400' }]}>{cat.name}</Text>
              </Tappable>
            );
          })}
        </View>
      </Step>

      <Step number="2" title="Describe the job" done={isReady}>
        <Field
          placeholder="e.g. Fix leaking kitchen faucet"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
          hint={title.length < 5 ? 'At least 5 characters' : `${title.length}/100`}
        />
        <Field
          placeholder="What needs doing? Mention size, materials, access and timing…"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ marginTop: 12 }}
          hint={description.length < 10 ? 'At least 10 characters' : `${description.length} characters`}
        />
      </Step>

      <Step number="3" title="Budget and location" done={!!budget && !!address}>
        <Field prefix="$" placeholder="0" value={budget} onChangeText={setBudget} keyboardType="numeric" suffix="USD" large />
        <Field icon="location" placeholder="Address or neighbourhood" value={address} onChangeText={setAddress} style={{ marginTop: 12 }} />
      </Step>

      {isReady ? (
        <Appear>
          <Text style={[type.footnote, { color: colors.textSecondary, textTransform: 'uppercase', marginLeft: 32, marginBottom: 8 }]}>Preview</Text>
          <JobCard
            job={{
              title, description, status: 'open', created_at: new Date().toISOString(),
              budget: budget || null, category_name: selectedCat?.name, category_slug: selectedCat?.slug,
              location_address: address || null,
            }}
          />
        </Appear>
      ) : null}

      <View style={{ marginHorizontal: 16, marginTop: 12 }}>
        <Button
          title={submitting ? 'Posting…' : 'Post Job'}
          icon="paper-plane"
          gradient
          loading={submitting}
          disabled={!isReady}
          onPress={handleSubmit}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Ionicons name="lock-closed" size={12} color={colors.textSecondary} />
          <Text style={[type.caption, { color: colors.textSecondary }]}>Payment is held safely until you confirm the work is done</Text>
        </View>
      </View>
    </Screen>
  );
}
