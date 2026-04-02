import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, logout } from '../../store/authSlice';
import api from '../../api/axios.instance';
import { colors, radius, shadows, typography, spacing } from '../../theme';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [focused, setFocused] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setSkills(user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : '') : '');
      setServiceRadius(user.service_radius_km?.toString() || '25');
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { name, phone };
      if (user.role === 'provider') {
        body.bio = bio;
        body.skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
        body.service_radius_km = parseInt(serviceRadius, 10) || 25;
      }
      await api.put('/auth/profile', body);
      Alert.alert('Success', 'Profile updated');
      dispatch(fetchProfile());
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  const isProvider = user?.role === 'provider';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Edit Section */}
      <Text style={styles.sectionTitle}>PERSONAL INFO</Text>

      <Text style={styles.label}>FULL NAME</Text>
      <TextInput
        style={[styles.input, focused === 'name' && styles.inputFocused]}
        placeholder="Your full name"
        placeholderTextColor={colors.textTertiary}
        value={name}
        onChangeText={setName}
        onFocus={() => setFocused('name')}
        onBlur={() => setFocused(null)}
      />

      <Text style={styles.label}>PHONE NUMBER</Text>
      <TextInput
        style={[styles.input, focused === 'phone' && styles.inputFocused]}
        placeholder="e.g. +1 555 123 4567"
        placeholderTextColor={colors.textTertiary}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        onFocus={() => setFocused('phone')}
        onBlur={() => setFocused(null)}
      />

      {isProvider && (
        <>
          <Text style={styles.sectionTitle}>PROVIDER DETAILS</Text>

          <Text style={styles.label}>BIO</Text>
          <TextInput
            style={[styles.input, styles.textArea, focused === 'bio' && styles.inputFocused]}
            placeholder="Tell customers about your experience and expertise..."
            placeholderTextColor={colors.textTertiary}
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            onFocus={() => setFocused('bio')}
            onBlur={() => setFocused(null)}
          />

          <Text style={styles.label}>SKILLS</Text>
          <TextInput
            style={[styles.input, focused === 'skills' && styles.inputFocused]}
            placeholder="e.g. Plumbing, Pipe Repair, Fixture Installation"
            placeholderTextColor={colors.textTertiary}
            value={skills}
            onChangeText={setSkills}
            onFocus={() => setFocused('skills')}
            onBlur={() => setFocused(null)}
          />
          <Text style={styles.hint}>Separate skills with commas</Text>

          <Text style={styles.label}>SERVICE RADIUS</Text>
          <View style={[styles.radiusRow, focused === 'radius' && styles.inputFocused]}>
            <TextInput
              style={styles.radiusInput}
              placeholder="25"
              placeholderTextColor={colors.textTertiary}
              value={serviceRadius}
              onChangeText={setServiceRadius}
              keyboardType="numeric"
              onFocus={() => setFocused('radius')}
              onBlur={() => setFocused(null)}
            />
            <Text style={styles.radiusUnit}>km</Text>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>

      {/* Danger Zone */}
      <View style={styles.dangerZone}>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  headerCard: {
    alignItems: 'center', backgroundColor: colors.white, padding: 28,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    marginBottom: 24, ...shadows.md,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, ...shadows.lg,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  userName: { ...typography.h2, marginBottom: 8 },
  roleBadge: {
    backgroundColor: colors.primaryBg, paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: radius.full, marginBottom: 8,
  },
  roleText: { ...typography.caption, color: colors.primary, fontSize: 10, fontWeight: '700' },
  email: { ...typography.bodySmall },

  sectionTitle: { ...typography.caption, marginBottom: 16, marginTop: 8 },
  label: { ...typography.caption, marginBottom: 8, marginTop: 16 },

  input: {
    backgroundColor: colors.white, padding: 16, borderRadius: radius.lg,
    fontSize: 16, color: colors.text,
    borderWidth: 1.5, borderColor: colors.border,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  textArea: { minHeight: 100, paddingTop: 16 },

  hint: { ...typography.bodySmall, fontSize: 11, marginTop: 6, color: colors.textTertiary },

  radiusRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16,
  },
  radiusInput: { flex: 1, paddingVertical: 16, fontSize: 18, fontWeight: '600', color: colors.text },
  radiusUnit: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },

  saveBtn: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 28, ...shadows.md,
  },
  saveBtnText: { ...typography.button, color: '#fff' },

  dangerZone: { marginTop: 32, alignItems: 'center' },
  logoutBtn: {
    paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.error,
  },
  logoutText: { ...typography.button, color: colors.error },
});
