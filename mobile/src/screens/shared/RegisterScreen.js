import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/authSlice';
import { colors, radius, shadows, typography } from '../../theme';

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
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Name, email and password are required');
      return;
    }
    dispatch(registerUser({ name, email, password, phone: phone || undefined, role }));
  };

  useEffect(() => {
    if (error) { Alert.alert('Registration Failed', error); dispatch(clearError()); }
  }, [error]);

  const InputField = ({ icon, placeholder, value, onChangeText, field, ...props }) => (
    <View style={[styles.inputGroup, focused === field && styles.inputGroupFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(field)}
        onBlur={() => setFocused(null)}
        {...props}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>{'\u2190'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create your{'\n'}account</Text>
      <Text style={styles.subtitle}>Join thousands of happy customers and providers</Text>

      {/* Role selector */}
      <View style={styles.roleSelector}>
        {[
          { key: 'customer', label: 'I need services', icon: '🏠' },
          { key: 'provider', label: 'I offer services', icon: '🔧' },
        ].map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.roleCard, role === r.key && styles.roleCardActive]}
            onPress={() => setRole(r.key)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>{r.icon}</Text>
            <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
            {role === r.key && <View style={styles.roleCheck}><Text style={styles.roleCheckText}>{'\u2713'}</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <InputField icon="U" field="name" placeholder="Full name" value={name} onChangeText={setName} />
      <InputField icon="@" field="email" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <InputField icon="*" field="password" placeholder="Password (min 6 chars)" value={password} onChangeText={setPassword} secureTextEntry />
      <InputField icon="#" field="phone" placeholder="Phone (optional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.buttonText}>
            Create {role === 'customer' ? 'Customer' : 'Provider'} Account
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.footerLink}> Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, paddingTop: 60 },

  backBtn: { marginBottom: 20 },
  backText: { ...typography.buttonSmall, color: colors.primary },

  title: { ...typography.h1, fontSize: 30, marginBottom: 8 },
  subtitle: { ...typography.bodySmall, marginBottom: 28 },

  roleSelector: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  roleCard: {
    flex: 1, padding: 16, borderRadius: radius.lg,
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', ...shadows.sm,
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  roleIcon: { fontSize: 28, marginBottom: 8 },
  roleLabel: { ...typography.bodySmall, fontWeight: '600', textAlign: 'center' },
  roleLabelActive: { color: colors.primary },
  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  roleCheckText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, marginBottom: 14,
  },
  inputGroupFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  inputIcon: { fontSize: 16, color: colors.textTertiary, marginRight: 12, width: 18, textAlign: 'center', fontWeight: '700' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.text },

  button: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 8,
    ...shadows.md,
  },
  buttonText: { ...typography.button, color: colors.textInverse },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
  footerText: { ...typography.bodySmall },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
