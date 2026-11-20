import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/authSlice';
import { Button, Glass, Tappable } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type } from '../../theme';

// Seeded local accounts (backend `npm run seed`); only offered in development builds
const DEMO_ACCOUNTS = [
  { label: 'Customer demo', icon: 'home', email: 'customer@demo.local', password: 'customer123' },
  { label: 'Provider demo', icon: 'construct', email: 'provider@demo.local', password: 'provider123' },
];

function FloatingBlob({ size, color, style, duration }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={[{
        position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color,
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) },
          { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) },
        ],
      }, style]}
    />
  );
}

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    dispatch(loginUser({ email: email.trim().toLowerCase(), password }));
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const inputStyle = [type.body, { flex: 1, color: colors.text, paddingVertical: 15, outlineStyle: 'none' }];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={colors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <FloatingBlob size={260} color="rgba(255,255,255,0.16)" style={{ top: -60, right: -80 }} duration={5200} />
      <FloatingBlob size={180} color="rgba(255,255,255,0.10)" style={{ top: 220, left: -70 }} duration={6400} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Brand */}
          <View style={{ alignItems: 'center', paddingTop: insets.top + 56, paddingBottom: 36, paddingHorizontal: 24 }}>
            <Glass style={{ width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <Ionicons name="hammer" size={38} color="#fff" />
            </Glass>
            <Text style={[type.largeTitle, { color: '#fff', marginTop: 20, textAlign: 'center' }]}>Services Marketplace</Text>
            <Text style={[type.callout, { color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' }]}>
              Trusted local pros. Payment held safely until the job is done.
            </Text>
          </View>

          {/* Sheet */}
          <View style={{
            flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 34, borderTopRightRadius: 34,
            paddingHorizontal: 20, paddingTop: 28, paddingBottom: insets.bottom + 24,
          }}>
            <Text style={[type.title1, { color: colors.text }]}>Welcome back</Text>
            <Text style={[type.subhead, { color: colors.textSecondary, marginTop: 4, marginBottom: 22 }]}>Sign in to continue</Text>

            {/* Grouped inputs, iOS style */}
            <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                <Ionicons name="mail" size={18} color={colors.textTertiary} style={{ marginRight: 12 }} />
                <TextInput
                  style={inputStyle}
                  placeholder="Email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 46 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                <Ionicons name="lock-closed" size={18} color={colors.textTertiary} style={{ marginRight: 12 }} />
                <TextInput
                  style={inputStyle}
                  placeholder="Password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            <Button title="Sign In" iconRight="arrow-forward" gradient loading={loading} onPress={handleLogin} style={{ marginTop: 20 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
              <Text style={[type.subhead, { color: colors.textSecondary }]}>New here? </Text>
              <Text onPress={() => navigation.navigate('Register')} style={[type.subhead, { color: colors.primary, fontWeight: '600' }]}>Create an account</Text>
            </View>

            {__DEV__ ? (
              <View style={{ marginTop: 28 }}>
                <Text style={[type.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: 10 }]}>TRY A DEMO ACCOUNT</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {DEMO_ACCOUNTS.map((a) => (
                    <Tappable
                      key={a.email}
                      onPress={() => { setEmail(a.email); setPassword(a.password); }}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 20, backgroundColor: colors.fill }}
                    >
                      <Ionicons name={a.icon} size={14} color={colors.text} />
                      <Text style={[type.footnote, { color: colors.text, fontWeight: '600' }]}>{a.label}</Text>
                    </Tappable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
