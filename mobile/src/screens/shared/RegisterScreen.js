import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/authSlice';
import { colors, radius, shadows, typography } from '../../theme';

const ROLES = [
  {
    key: 'customer',
    icon: 'home-outline',
    title: 'I Need Services',
    desc: 'Post jobs & hire professionals',
  },
  {
    key: 'provider',
    icon: 'construct-outline',
    title: 'I Offer Services',
    desc: 'Find jobs & earn money',
  },
];

function Field({ label, icon, placeholder, value, onChangeText, field, focused, onFocus, onBlur, secure, keyboardType, autoCapitalize, autoComplete }) {
  const [showPass, setShowPass] = useState(false);
  const isFocused = focused === field;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
        <Ionicons name={icon} size={18} color={isFocused ? colors.primary : colors.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPass}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoComplete={autoComplete}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
            <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [focused, setFocused] = useState(null);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    dispatch(registerUser({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone || undefined, role }));
  };

  useEffect(() => {
    if (error) { Alert.alert('Registration Failed', error); dispatch(clearError()); }
  }, [error]);

  const fo = (field) => ({ onFocus: () => setFocused(field), onBlur: () => setFocused(null) });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <View style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </View>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Create Account</Text>
      <Text style={styles.pageSub}>Join thousands of happy users</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        {ROLES.map((r) => {
          const active = role === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleCard, active && styles.roleCardActive]}
              onPress={() => setRole(r.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
                <Ionicons name={r.icon} size={22} color={active ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{r.title}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
              {active && (
                <View style={styles.roleCheck}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Fields */}
      <Field label="Full Name" icon="person-outline" placeholder="John Smith" value={name} onChangeText={setName} field="name" focused={focused} {...fo('name')} autoComplete="name" />
      <Field label="Email Address" icon="mail-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} field="email" focused={focused} {...fo('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Password" icon="lock-closed-outline" placeholder="Min. 6 characters" value={password} onChangeText={setPassword} field="password" focused={focused} {...fo('password')} secure autoComplete="new-password" />
      <Field label="Phone (optional)" icon="call-outline" placeholder="+1 555 000 0000" value={phone} onChangeText={setPhone} field="phone" focused={focused} {...fo('phone')} keyboardType="phone-pad" autoCapitalize="none" />

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color={colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>
              Create {role === 'customer' ? 'Customer' : 'Provider'} Account
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.footerLink}> Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingTop: 56, paddingBottom: 48 },

  backBtn: { marginBottom: 24 },
  backCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center',
    ...shadows.sm,
  },

  pageTitle: { ...typography.h1, marginBottom: 4 },
  pageSub: { ...typography.bodySmall, marginBottom: 28 },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  roleCard: {
    flex: 1, padding: 16, borderRadius: radius.xl,
    backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', position: 'relative',
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  roleIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.bgAlt, justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  roleIconWrapActive: { backgroundColor: 'rgba(37,99,235,0.12)' },
  roleTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 4 },
  roleTitleActive: { color: colors.primary },
  roleDesc: { fontSize: 11, color: colors.textTertiary, textAlign: 'center', lineHeight: 15 },
  roleCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, backgroundColor: colors.bg,
    paddingHorizontal: 14,
  },
  inputRowFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, paddingVertical: 16,
    borderRadius: radius.lg, marginTop: 8,
    ...shadows.md,
  },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { ...typography.bodySmall },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
