import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Switch, Animated, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile, logout } from '../../store/authSlice';
import api from '../../api/axios.instance';
import { useTheme } from '../../context/ThemeContext';
import { clearPushToken } from '../../utils/push';
import { radius, shadows, typography } from '../../theme';

function makeStyles(colors) {
  return {
    container: { flex: 1, backgroundColor: colors.bg },
    content: { paddingBottom: 60 },

    // Header card
    headerCard: {
      alignItems: 'center',
      backgroundColor: colors.gradientStart,
      paddingTop: 32, paddingBottom: 40, paddingHorizontal: 24,
    },
    avatarWrap: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 14,
      borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
      ...shadows.lg,
    },
    avatarText: { color: '#fff', fontSize: 34, fontWeight: '800' },
    userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
    rolePill: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 14, paddingVertical: 4,
      borderRadius: radius.full, marginBottom: 6,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    roleText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1, textTransform: 'uppercase' },
    email: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '400' },

    // Sections
    section: {
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      marginHorizontal: 16, marginTop: 16,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },

    // Fields
    fieldRow: {
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    fieldInput: {
      fontSize: 15, color: colors.text, fontWeight: '500',
      backgroundColor: colors.inputBg || colors.bg,
      borderRadius: radius.md, padding: 12,
      borderWidth: 1.5, borderColor: colors.border,
    },
    fieldInputFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
    textArea: { minHeight: 90, textAlignVertical: 'top' },

    // Setting rows
    settingRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    settingRowLast: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 16,
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    settingIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center',
    },
    settingLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
    settingDesc: { fontSize: 12, color: colors.textTertiary, marginTop: 1 },

    // Save button
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.primary, marginHorizontal: 16, marginTop: 16,
      paddingVertical: 16, borderRadius: radius.lg, gap: 8,
      ...shadows.md,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Logout
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginHorizontal: 16, marginTop: 12,
      paddingVertical: 15, borderRadius: radius.lg, gap: 8,
      borderWidth: 1.5, borderColor: colors.error,
      backgroundColor: colors.errorBg,
    },
    logoutText: { color: colors.error, fontSize: 15, fontWeight: '700' },

    hint: { fontSize: 11, color: colors.textTertiary, marginTop: 5, paddingHorizontal: 16, paddingBottom: 10 },
  };
}

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [focused, setFocused] = useState(null);
  const [saving, setSaving] = useState(false);

  // Animated value for the dark mode toggle label
  const toggleAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

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
    if (!name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return; }
    setSaving(true);
    try {
      const body = { name: name.trim(), phone: phone.trim() || undefined };
      if (user?.role === 'provider') {
        body.bio = bio;
        body.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
        body.service_radius_km = parseInt(serviceRadius, 10) || 25;
      }
      await api.put('/auth/profile', body);
      Alert.alert('Saved!', 'Your profile has been updated.');
      dispatch(fetchProfile());
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const isProvider = user?.role === 'provider';
  const fo = (field) => ({ onFocus: () => setFocused(field), onBlur: () => setFocused(null) });

  const themeIconBg = isDark ? 'rgba(251,191,36,0.15)' : 'rgba(30,58,138,0.1)';
  const themeIconColor = isDark ? colors.accent : colors.gradientStart;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Personal Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Personal Info</Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            style={[styles.fieldInput, focused === 'name' && styles.fieldInputFocused]}
            placeholder="Your full name"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            {...fo('name')}
          />
        </View>

        <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            style={[styles.fieldInput, focused === 'phone' && styles.fieldInputFocused]}
            placeholder="e.g. +1 555 123 4567"
            placeholderTextColor={colors.textTertiary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            {...fo('phone')}
          />
        </View>
      </View>

      {/* Provider Details */}
      {isProvider && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct-outline" size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>Provider Details</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, styles.textArea, focused === 'bio' && styles.fieldInputFocused]}
              placeholder="Tell customers about your experience..."
              placeholderTextColor={colors.textTertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              {...fo('bio')}
            />
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Skills</Text>
            <TextInput
              style={[styles.fieldInput, focused === 'skills' && styles.fieldInputFocused]}
              placeholder="e.g. Plumbing, Pipe Repair, Fixtures"
              placeholderTextColor={colors.textTertiary}
              value={skills}
              onChangeText={setSkills}
              {...fo('skills')}
            />
            <Text style={styles.hint}>Separate skills with commas</Text>
          </View>

          <View style={[styles.fieldRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Service Radius (km)</Text>
            <TextInput
              style={[styles.fieldInput, focused === 'radius' && styles.fieldInputFocused]}
              placeholder="25"
              placeholderTextColor={colors.textTertiary}
              value={serviceRadius}
              onChangeText={setServiceRadius}
              keyboardType="numeric"
              {...fo('radius')}
            />
          </View>
        </View>
      )}

      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Appearance Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: themeIconBg }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={themeIconColor}
              />
            </View>
            <View>
              <Text style={styles.settingLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.settingDesc}>
                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary + 'AA' }}
            thumbColor={isDark ? colors.primary : colors.white}
            ios_backgroundColor={colors.border}
          />
        </View>

        <View style={styles.settingRowLast}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.successBg }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDesc}>Job updates and messages</Text>
            </View>
          </View>
          <Switch
            value={true}
            trackColor={{ false: colors.border, true: colors.success + 'AA' }}
            thumbColor={colors.success}
            ios_backgroundColor={colors.border}
          />
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.infoBg }]}>
              <Ionicons name="mail-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Email</Text>
              <Text style={styles.settingDesc}>{user?.email}</Text>
            </View>
          </View>
          <Ionicons name="lock-closed-outline" size={16} color={colors.textTertiary} />
        </View>

        <View style={styles.settingRowLast}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="star-outline" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.settingLabel}>Account Type</Text>
              <Text style={styles.settingDesc}>{isProvider ? 'Service Provider' : 'Customer'}</Text>
            </View>
          </View>
          <View style={{
            backgroundColor: colors.primaryBg, paddingHorizontal: 10, paddingVertical: 3,
            borderRadius: radius.full, borderWidth: 1, borderColor: colors.primaryBorder,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
              {isProvider ? 'Pro' : 'Free'}
            </Text>
          </View>
        </View>
      </View>

      {/* Log Out */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: async () => { await clearPushToken(); dispatch(logout()); } },
          ]);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}
