import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/authSlice';
import { colors, radius, shadows, typography } from '../../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState(null);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }
    dispatch(loginUser({ email, password }));
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>S</Text>
          </View>
          <Text style={styles.title}>Services</Text>
          <Text style={styles.titleAccent}>Marketplace</Text>
          <Text style={styles.subtitle}>Find trusted local professionals</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={[styles.inputGroup, focused === 'email' && styles.inputGroupFocused]}>
            <Text style={styles.inputIcon}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={[styles.inputGroup, focused === 'password' && styles.inputGroupFocused]}>
            <Text style={styles.inputIcon}>*</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}> Create one</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'center', padding: 24 },

  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, ...shadows.lg,
  },
  logoEmoji: { fontSize: 32, fontWeight: '900', color: colors.textInverse },
  title: { ...typography.h1, fontSize: 32, color: colors.text },
  titleAccent: { ...typography.h1, fontSize: 32, color: colors.primary, marginTop: -4 },
  subtitle: { ...typography.bodySmall, marginTop: 8 },

  form: { marginBottom: 24 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 16, marginBottom: 14,
    ...shadows.sm,
  },
  inputGroupFocused: { borderColor: colors.primary, backgroundColor: colors.primaryBg },
  inputIcon: { fontSize: 18, color: colors.textTertiary, marginRight: 12, width: 20, textAlign: 'center', fontWeight: '700' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: colors.text },

  button: {
    backgroundColor: colors.primary, paddingVertical: 18,
    borderRadius: radius.lg, alignItems: 'center', marginTop: 8,
    ...shadows.md,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { ...typography.button, color: colors.textInverse },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodySmall },
  footerLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
