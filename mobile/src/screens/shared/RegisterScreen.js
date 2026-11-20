import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/authSlice';
import { Screen, Field, Button, IconTile, Tappable, alpha } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { type, shadows } from '../../theme';

const ROLES = [
  { key: 'customer', icon: 'home', tone: 'primary', title: 'I need help', desc: 'Post jobs and hire local pros' },
  { key: 'provider', icon: 'construct', tone: 'accent', title: 'I offer services', desc: 'Find jobs and get paid securely' },
];

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
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

  return (
    <Screen title="Create account" subtitle="It takes less than a minute.">
      <View style={{ flexDirection: 'row', gap: 12, marginHorizontal: 16 }}>
        {ROLES.map((r) => {
          const active = role === r.key;
          const tint = colors[r.tone];
          return (
            <Tappable
              key={r.key}
              onPress={() => setRole(r.key)}
              scaleTo={0.96}
              accessibilityState={{ selected: active }}
              style={[{
                flex: 1, padding: 16, borderRadius: 22, backgroundColor: active ? alpha(tint, 0.1) : colors.card,
                borderWidth: 2, borderColor: active ? tint : 'transparent',
              }, !isDark && !active ? shadows.sm : null]}
            >
              <IconTile icon={r.icon} tone={r.tone} size={40} />
              <Text style={[type.headline, { color: colors.text, marginTop: 12 }]}>{r.title}</Text>
              <Text style={[type.footnote, { color: colors.textSecondary, marginTop: 2 }]}>{r.desc}</Text>
              <View style={{ position: 'absolute', top: 14, right: 14 }}>
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? tint : colors.textTertiary} />
              </View>
            </Tappable>
          );
        })}
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 24, gap: 14 }}>
        <Field label="Full name" icon="person" placeholder="Jane Smith" value={name} onChangeText={setName} autoComplete="name" />
        <Field label="Email" icon="mail" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Password" icon="lock-closed" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secure autoComplete="new-password" />
        <Field label="Phone (optional)" icon="call" placeholder="+383 44 000 000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 24 }}>
        <Button
          title={`Create ${role === 'customer' ? 'Customer' : 'Provider'} Account`}
          gradient
          loading={loading}
          onPress={handleRegister}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18 }}>
          <Text style={[type.subhead, { color: colors.textSecondary }]}>Already have an account? </Text>
          <Text onPress={() => navigation.goBack()} style={[type.subhead, { color: colors.primary, fontWeight: '600' }]}>Sign in</Text>
        </View>
      </View>
    </Screen>
  );
}
